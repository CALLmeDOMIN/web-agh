// server.js — prosta usluga generujaca 3 sygnaly obserwowalnosci:
//   * METRYKI  -> /metrics (format Prometheus), zbierane przez Prometheus
//   * LOGI     -> JSON na stdout, zbierane przez Grafana Alloy -> Loki
//   * TRACE'Y  -> OTLP -> Tempo (auto-instrumentacja w tracing.js)
//
// Klucz do korelacji: pino (przez instrumentation-pino) dokleja do KAZDEGO logu
// pola trace_id i span_id biezacego requestu. Dzieki temu w Grafanie skaczemy
// z logu wprost do trace'a i odwrotnie.

const express = require('express');
const client = require('prom-client');
const pino = require('pino');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// METRYKI (prom-client)
// ---------------------------------------------------------------------------
const register = new client.Registry();
register.setDefaultLabels({ app: 'demo-app' });
client.collectDefaultMetrics({ register }); // CPU, RAM, event loop, GC...

// Klasyczne metryki RED (Rate / Errors / Duration)
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Liczba obsluzonych requestow HTTP',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Czas obslugi requestu HTTP w sekundach',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

// Middleware mierzacy kazdy request
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    // req.route?.path -> stabilna etykieta (np. /users/:id zamiast /users/42)
    const route = (req.route && req.route.path) || req.path || 'unknown';
    const labels = { method: req.method, route, status: res.statusCode };
    httpRequestsTotal.inc(labels);
    end(labels);
    logger.info(
      { method: req.method, route, status: res.statusCode },
      'request obsluzony'
    );
  });
  next();
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// ENDPOINTY DEMO
// ---------------------------------------------------------------------------
app.get('/', (_req, res) => {
  res.json({
    service: 'lgtm-demo-app',
    endpoints: ['/rolldice', '/slow', '/error', '/users/:id', '/metrics'],
  });
});

// Rzut kostka — czasem "drogi" (symulacja wolnej galezi kodu)
app.get('/rolldice', async (_req, res) => {
  const roll = 1 + Math.floor(Math.random() * 6);
  if (roll === 6) {
    logger.warn({ roll }, 'wyrzucono 6 — wchodzimy w wolna sciezke');
    await sleep(300 + Math.random() * 400);
  }
  res.json({ roll });
});

// Endpoint o losowej, zmiennej latencji — ladnie widac p95/p99 na histogramie
app.get('/slow', async (_req, res) => {
  const delay = 100 + Math.floor(Math.random() * 1500);
  await sleep(delay);
  res.json({ slept_ms: delay });
});

// Endpoint generujacy bledy (~25% szans) — napedza metryke Errors
app.get('/error', (_req, res) => {
  if (Math.random() < 0.25) {
    logger.error('cos poszlo nie tak w /error');
    return res.status(500).json({ error: 'internal_error' });
  }
  res.json({ ok: true });
});

// Symulacja wywolania "bazy danych" — pokazuje span potomny w trace
app.get('/users/:id', async (req, res) => {
  const t = 20 + Math.floor(Math.random() * 120);
  await sleep(t); // udaje zapytanie do DB
  logger.info({ userId: req.params.id, db_ms: t }, 'pobrano uzytkownika');
  res.json({ id: req.params.id, name: 'User ' + req.params.id });
});

// Endpoint metryk dla Prometheusa
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'demo-app wystartowala');
});
