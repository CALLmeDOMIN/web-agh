# backend_basic.py
import uvicorn
from fastapi import FastAPI, Depends
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
# Wklej to w gateway_basic.py pod linijką: app = FastAPI(title="API_Gateway_Service")
from fastapi.middleware.cors import CORSMiddleware

# --- CONFIG OPENTELEMETRY ---
provider = TracerProvider()
provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))
trace.set_tracer_provider(provider)

app = FastAPI(title="Core_Backend_Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Wpuść absolutnie każdy origin (w tym localhost:63342)
    allow_methods=["*"],  # Wpuść GET, POST, OPTIONS itd.
    allow_headers=["*"],  # Wpuść nagłówki (w tym Authorization z tokenem)
)
# --- CONFIG BAZY DANYCH ---
DATABASE_URL = "sqlite:///./sklep.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
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
SQLAlchemyInstrumentor().instrument(engine=engine)  # Śledzi każde zapytanie SQL do tej bazy


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

    # Możesz też wpleść własny, customowy span wewnątrz automatycznego
    tracer = trace.get_tracer(__name__)
    with tracer.start_as_current_span("LogikaBiznesowa_Magazyn"):
        print("[Backend] Sprawdzam stany magazynowe w bazie...")
        # Tutaj mogłyby być dodatkowe operacje

    # Zapis do SQLite przez SQLAlchemy
    nowe_zamowienie = Zamowienie(produkt=item, kupujacy=user)
    db.add(nowe_zamowienie)
    db.commit()
    db.refresh(nowe_zamowienie)

    return {"status": "Zapisano w bazie", "id_zamowienia": nowe_zamowienie.id}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)