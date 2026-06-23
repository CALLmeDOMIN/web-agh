import uvicorn
import httpx
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware # <--- TEGO BRAKOWAŁO!
from fastapi.responses import HTMLResponse

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource

# --- CONFIG OPENTELEMETRY ---
resource = Resource.create(attributes={"service.name": "API_Gateway"})
provider = TracerProvider(resource=resource)

# Skierowane na nazwę kontenera jaeger z docker-compose
otlp_exporter = OTLPSpanExporter(endpoint="http://jaeger:4317")
provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
trace.set_tracer_provider(provider)

app = FastAPI(title="API_Gateway_Service")

# Wpięcie CORS zapobiegające blokowaniu żądań przez przeglądarkę
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Zezwól na ruch z każdego miejsca
    allow_methods=["*"],
    allow_headers=["*"],
)

FastAPIInstrumentor.instrument_app(app)
HTTPXClientInstrumentor().instrument()

# --- WARSTWA AUTH ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def weryfikuj_token(token: str = Depends(oauth2_scheme)):
    if token != "token-dla-giga-developera-123":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Brak autoryzacji lub lewy token!",
        )
    return "ZalogowanyUzytkownik"

# --- ENDPOINTY ---
@app.get("/login")
def login():
    return {"access_token": "token-dla-giga-developera-123", "token_type": "bearer"}

@app.post("/kup-produkt")
async def kup_produkt(item: str, user: str = Depends(weryfikuj_token)):
    print(f"[Gateway] Auth OK dla {user}. Strzelam HTTP do Core Backend...")
    async with httpx.AsyncClient() as client:
        # Skierowane na nazwę kontenera core_backend z docker-compose
        response = await client.post(
            f"http://core_backend:8001/procesuj-zamowienie?item={item}&user={user}"
        )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Core backend wywalił błąd!")

    return response.json()

@app.get("/", response_class=HTMLResponse)
def index():
    with open("index.html", "r", encoding="utf-8") as f:
        return f.read()

if __name__ == "__main__":
    # Host zmieniony na 0.0.0.0 dla Dockera
    uvicorn.run(app, host="0.0.0.0", port=8000)