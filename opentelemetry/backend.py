import uvicorn
from fastapi import FastAPI, Depends
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from fastapi.middleware.cors import CORSMiddleware
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource

# --- CONFIG OPENTELEMETRY ---
resource = Resource.create(attributes={"service.name": "Core_Backend"})
provider = TracerProvider(resource=resource)
otlp_exporter = OTLPSpanExporter(endpoint="http://jaeger:4317")
provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
trace.set_tracer_provider(provider)

app = FastAPI(title="Core_Backend_Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIG BAZY DANYCH ---
DATABASE_URL = "postgresql://giga_dev:password123@postgres_db:5432/sklep_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Zamowienie(Base):
    __tablename__ = "zamowienia"
    id = Column(Integer, primary_key=True, index=True)
    produkt = Column(String)
    kupujacy = Column(String)

Base.metadata.create_all(bind=engine)

# --- AUTOMATYCZNA INSTRUMENTACJA ---
FastAPIInstrumentor.instrument_app(app)
SQLAlchemyInstrumentor().instrument(engine=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ENDPOINTY ---
@app.post("/procesuj-zamowienie")
def procesuj_zamowienie(item: str, user: str, db: Session = Depends(get_db)):
    print(f"[Backend] Odebrałem żądanie dla produktu: {item}. Zapisuję w bazie...")

    tracer = trace.get_tracer(__name__)
    with tracer.start_as_current_span("LogikaBiznesowa_Magazyn"):
        print("[Backend] Sprawdzam stany magazynowe w bazie...")

    nowe_zamowienie = Zamowienie(produkt=item, kupujacy=user)
    db.add(nowe_zamowienie)
    db.commit()
    db.refresh(nowe_zamowienie)

    return {"status": "Zapisano w bazie", "id_zamowienia": nowe_zamowienie.id}

if __name__ == "__main__":
    # Host zmieniony na 0.0.0.0 dla Dockera
    uvicorn.run(app, host="0.0.0.0", port=8001)