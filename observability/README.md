# Demo: Grafana LGTM + Prometheus — praktyczna obserwowalność

Samodzielne demo do prezentacji. Jedna komenda uruchamia aplikację, która emituje
**trzy sygnały obserwowalności**, oraz cały stack do ich zbierania, przechowywania
i — co najważniejsze — **korelowania**.

## Trzy filary obserwowalności

| Sygnał | Pytanie, na które odpowiada | Narzędzie tutaj |
|--------|-----------------------------|-----------------|
| **Metryki** | *Czy* coś jest nie tak? (trend, alert) | Prometheus |
| **Logi**    | *Co dokładnie* się stało? | Loki (+ Alloy) |
| **Trace'y** | *Gdzie* w systemie jest problem? | Tempo |

LGTM = **L**oki · **G**rafana · **T**empo · **M**imir. W tym demo rolę Mimira
(skalowalny Prometheus) pełni zwykły **Prometheus** — temat prezentacji.

## Architektura

```
            ┌────────────┐   /metrics (pull)   ┌──────────────┐
            │            │ ──────────────────► │  Prometheus  │◄─┐
            │            │                      └──────┬───────┘  │ remote_write
            │  demo-app  │   OTLP (push)        ┌──────▼───────┐  │ (span-metrics,
   ruch ───►│ (Node.js + │ ──────────────────► │    Tempo     │──┘  service graph)
  (loadgen) │  Express)  │                      └──────────────┘
            │            │   stdout (JSON)      ┌──────────────┐   push  ┌──────┐
            │            │ ──────────────────► │    Alloy     │ ──────► │ Loki │
            └────────────┘   logi kontenera     └──────────────┘         └──────┘
                                                        ▲
                                                ┌───────┴────────┐
                                                │    Grafana     │  ← wizualizacja
                                                │ (datasources + │    + KORELACJA
                                                │  dashboardy)   │
                                                └────────────────┘
```

## Uruchomienie

> Wymagany **Docker Desktop** (z włączonym Docker Compose).

```bash
cd observability
docker compose up -d --build
```

Pierwszy start ciągnie obrazy + buduje aplikację (~1–2 min). Potem:

| Usługa | URL | Uwagi |
|--------|-----|-------|
| **Grafana** | http://localhost:3000 | logowanie anonimowe (rola Admin) |
| Aplikacja demo | http://localhost:3001 | endpointy `/rolldice`, `/slow`, `/error`, `/users/:id` |
| Surowe metryki | http://localhost:3001/metrics | format Prometheus |
| Prometheus | http://localhost:9090 | |
| Tempo | http://localhost:3200 | |

`loadgen` automatycznie generuje ruch, więc wykresy „żyją" od razu.

Zatrzymanie: `docker compose down` (z wyczyszczeniem danych: `docker compose down -v`).

## Scenariusz demo „na żywo" (sugestia ~7–10 min)

1. **Metryki / RED.** Grafana → dashboard **Demo · RED + Logi**.
   Pokaż trzy panele: **R**ate (req/s), **E**rrors (% 5xx), **D**uration (p50/p95/p99).
   To jest „termometr" systemu — widać *że* `/error` sypie błędami, a `/slow` ma wysokie p99.

2. **PromQL na żywo.** Grafana → *Explore* → datasource **Prometheus**:
   ```promql
   sum by (route) (rate(http_requests_total[1m]))
   histogram_quantile(0.95, sum by (le,route) (rate(http_request_duration_seconds_bucket[5m])))
   ```

3. **Logi / LogQL.** *Explore* → **Loki**:
   ```logql
   {container="observability-app-1"} | json | level="error"
   ```
   Pokaż, że log błędu zawiera pole `trace_id`.

4. **Korelacja log → trace.** W szczegółach logu kliknij link **„Zobacz trace"**
   (Grafana wyciąga `trace_id` przez *derived field*). Ląduje Cię w **Tempo**,
   gdzie widać cały request rozbity na span'y (Express → handler → „DB").

5. **Korelacja trace → logi/metryki.** W widoku trace'a w Tempo kliknij span →
   *„Logs for this span"* (skok do Loki) oraz zobacz powiązane metryki.

6. **Service graph / TraceQL.** *Explore* → **Tempo** → zakładka *Service Graph*
   (dane generuje `metrics_generator` Tempo → Prometheus). Albo TraceQL:
   ```traceql
   { duration > 500ms }
   { name = "GET /slow" && duration > 1s }
   ```

7. **Pointa.** Jeden incydent, trzy sygnały, jedno kliknięcie między nimi —
   to właśnie „praktyczna obserwowalność": nie trzy osobne narzędzia, tylko
   jeden przepływ od symptomu (metryka) do przyczyny (trace + log).

## Co warto podkreślić na slajdach

- **Pull vs push:** Prometheus *scrapuje* `/metrics` (pull); trace'y i logi są *wypychane* (push).
- **OpenTelemetry** to standard instrumentacji niezależny od dostawcy — tu auto-instrumentacja
  Node owija Express/HTTP bez zmian w kodzie biznesowym (`tracing.js` ładowane przez `-r`).
- **Korelacja przez `trace_id`** w logach to klej całego stacku (patrz `instrumentation-pino`).
- **RED za darmo:** `metrics_generator` Tempo liczy metryki RED i graf usług z samych trace'ów.
- Prometheus skaluje się słabo poziomo → w produkcji **Mimir** (długie retencje, multi-tenancy).

## Struktura plików

```
observability/
├─ docker-compose.yml          # spina caly stack
├─ app/                        # aplikacja demo (Node + Express + OTel)
│  ├─ server.js                #   endpointy + metryki (prom-client) + logi (pino)
│  ├─ tracing.js               #   inicjalizacja OpenTelemetry (trace'y -> Tempo)
│  └─ Dockerfile
├─ prometheus/prometheus.yml   # konfiguracja scrapowania
├─ loki/loki-config.yml        # Loki (single binary)
├─ tempo/tempo.yml             # Tempo + metrics_generator
├─ alloy/config.alloy          # zbieranie logow Dockera -> Loki
└─ grafana/provisioning/       # datasource'y (z korelacja) + dashboard RED
```

## Rozwiązywanie problemów

- **Brak logów w Loki / panelu „Logi"** — Alloy potrzebuje dostępu do socketu Dockera
  (`/var/run/docker.sock`). Na Docker Desktop (Win/Mac) działa to domyślnie. Sprawdź:
  `docker compose logs alloy`. Etykieta kontenera to nazwa z `docker ps`
  (domyślnie `observability-app-1`) — jeśli zmienisz nazwę projektu, popraw zapytanie LogQL.
- **Brak trace'ów** — sprawdź `docker compose logs app` (czy `[otel] tracing wlaczone`)
  oraz czy Tempo wstało: `docker compose logs tempo`.
- **Pusty service graph** — `metrics_generator` potrzebuje chwili ruchu; odczekaj ~1 min.
```
