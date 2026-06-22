# gateway_basic.py
import uvicorn
import httpx
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from fastapi.responses import HTMLResponse
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource

# --- CONFIG OPENTELEMETRY ---

# Definiujemy nazwę, pod jaką serwis pojawi się w Jaegerze
resource = Resource.create(attributes={"service.name": "API_Gateway"})

provider = TracerProvider(resource=resource)
# Wysyłamy dane na port 4317 (tam domyślnie słucha Jaeger)
otlp_exporter = OTLPSpanExporter(endpoint="http://127.0.0.1:4317")
provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
trace.set_tracer_provider(provider)


app = FastAPI(title="API_Gateway_Service")

# Automatyczne wpięcie OTel w cykl życia FastAPI oraz klienta HTTPX
FastAPIInstrumentor.instrument_app(app)
HTTPXClientInstrumentor().instrument()

# --- WARSTWA AUTH ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def weryfikuj_token(token: str = Depends(oauth2_scheme)):
    # Maksymalnie uproszczony, ale działający mechanizm Bearer Tokena
    if token != "token-dla-giga-developera-123":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Brak autoryzacji lub lewy token!",
        )
    return "ZalogowanyUzytkownik"


# --- ENDPOINTY ---
@app.get("/login")
def login():
    """Generuje token auth dla klienta"""
    return {"access_token": "token-dla-giga-developera-123", "token_type": "bearer"}


@app.post("/kup-produkt")
async def kup_produkt(item: str, user: str = Depends(weryfikuj_token)):
    print(f"[Gateway] Auth OK dla {user}. Strzelam HTTP do Core Backend...")

    # Klient HTTPX dzięki instrumentacji automatycznie przekaże Trace ID dalej w nagłówkach
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"http://127.0.0.1:8001/procesuj-zamowienie?item={item}&user={user}"
        )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Core backend wywalił błąd!")

    return response.json()

@app.get("/", response_class=HTMLResponse)
def index():
    """Serwuje plik HTML bezpośrednio z serwera, co całkowicie zabija problem CORS"""
    with open("index.html", "r", encoding="utf-8") as f:
        return f.read()

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)