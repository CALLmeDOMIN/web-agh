// tracing.js — inicjalizacja OpenTelemetry.
// Ladowane PRZED aplikacja przez: node -r ./tracing.js server.js
// Dzieki temu auto-instrumentacja "owija" Express/HTTP zanim powstana ich handlery.
//
// Cala konfiguracja idzie przez zmienne srodowiskowe (patrz docker-compose.yml):
//   OTEL_SERVICE_NAME            -> nazwa uslugi widoczna w Tempo/Grafanie
//   OTEL_EXPORTER_OTLP_ENDPOINT  -> dokad wysylac trace'y (http://tempo:4318)
//   OTEL_EXPORTER_OTLP_PROTOCOL  -> http/protobuf

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

const sdk = new NodeSDK({
  // URL czytany z OTEL_EXPORTER_OTLP_ENDPOINT (+ doklejone /v1/traces)
  traceExporter: new OTLPTraceExporter(),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Wylaczamy halaśliwa instrumentacje systemu plikow
      '@opentelemetry/instrumentation-fs': { enabled: false },
      // instrumentation-pino automatycznie wstrzykuje trace_id/span_id do logow
    }),
  ],
});

sdk.start();
// eslint-disable-next-line no-console
console.log('[otel] tracing wlaczone, eksport do', process.env.OTEL_EXPORTER_OTLP_ENDPOINT);

process.on('SIGTERM', () => {
  sdk.shutdown().finally(() => process.exit(0));
});
