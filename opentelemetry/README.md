# Demo: Distributed Tracing w praktyce — FastAPI, PostgreSQL i Jaeger
## Architektura i Przepływ Żądania

Projekt demonstruje kaskadowe przechodzenie kontekstu śledzenia (Context Propagation) przez wiele warstw systemu podczas jednej operacji biznesowej („Kup produkt”):

WARSTWA KLIENTA             API GATEWAY (Port 8000)        CORE BACKEND (Port 8001)
         ┌─────────────────┐           ┌───────────────────┐          ┌───────────────────┐
         │                 │  HTTP GET │                   │          │                   │
         │ Przeglądarka    ├──────────►│  • Serwuje Front  │          │                   │
         │ (index.html)    │  (HTML)   │  • Autoryzacja    │          │                   │
         │                 │           │  • Instrumentacja │          │                   │
         └────────┬────────┘           └─────────┬─────────┘          └─────────┬─────────┘
                  ▲                              │                              │
                  │ HTTP POST                    │ HTTP POST                    │ SQLAlchemy
                  │ /kup-produkt                 │ /procesuj-zamowienie         │ (SQL Query)
                  └──────────────────────────────┼─────────────────────────────►│
                                                 │ (Wstrzyknięte Trace ID)      │
                                                 ▼                              ▼
                                       ┌──────────────────────────────────────────────────┐
                                       │                 JAEGER UI                        │
                                       │              (Port 16686 / 4317)                 │
                                       │   Wizualizacja całego śladu rozproszonego        │
                                       └──────────────────────────────────────────────────┘


## Komponenty Systemu

| Komponent | Rola w systemie | Wykorzystane technologie |
| :--- | :--- | :--- |
| **API Gateway** | Punkt wejścia (Reverse Proxy), serwuje front, wymusza autoryzację Bearer Token. | FastAPI, Uvicorn, HTTPX |
| **Core Backend** | Logika biznesowa, przetwarzanie magazynowe, zapis zamówień. | FastAPI, SQLAlchemy |
| **Database** | Trwała warstwa danych (zapis tabeli `zamowienia`). | PostgreSQL (Kontener) |
| **Jaeger** | Kolektor telemetryczny (OTLP) oraz interfejs graficzny do analizy śladów. | Jaeger All-In-One (Kontener) |

## Uruchomienie

> Wymagany zainstalowany **Docker** oraz **Docker Desktop / Docker Compose**.

Wszystkie usługi (w tym instalacja zależności Pythona wewnątrz izolowanych środowisk) podnoszone są jedną komendą z katalogu głównego projektu:

```bash
docker compose up -d
```

### Dostępne adresy URL:

| Usługa | URL | Opis |
| :--- | :--- | :--- |
| **Front-end / Sklep** | http://localhost:8000/ | Prosty interfejs graficzny do symulacji zakupu |
| **Jaeger UI** | http://localhost:16686/ | Panel do przeglądania i analizy wygenerowanych śladów |
| **API Gateway Docs** | http://localhost:8000/docs | Automatyczna dokumentacja OpenAPI dla Gatewaya |
| **Core Backend Docs** | http://localhost:8001/docs | Automatyczna dokumentacja OpenAPI dla Backendu |