import os
import numpy as np
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

MODEL_DIR = os.path.join("outputs", "models")
PREP_DIR  = os.path.join("outputs", "preprocessed")

iso_forest  = joblib.load(os.path.join(MODEL_DIR, "isolation_forest.pkl"))
scaler_if   = joblib.load(os.path.join(PREP_DIR,  "scaler_if.pkl"))
threshold   = float(np.load(os.path.join(MODEL_DIR, "threshold_if.npy"))[0])

# Pre-load aligned test features for fast feature vector retrieval by minute
test_if_path = os.path.join(PREP_DIR, "test_if.npy")
test_if_data = np.load(test_if_path) if os.path.exists(test_if_path) else None

print(f"Modèle chargé. Seuil : {threshold}")

app = FastAPI(
    title="API de détection de dégradation de performance",
    description="Prédit si un système IT est en dégradation à partir de ses métriques",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MetricsInput(BaseModel):
    metrics: List[float]  # liste de 128 valeurs (features enrichies)

class PredictionOutput(BaseModel):
    prediction: int       # 0 = normal, 1 = anomalie
    score: float          # score brut du modèle
    status: str           # "normal" ou "anomalie"
    message: str          # explication lisible

@app.get("/health")
def health():
    return {"status": "ok", "model": "Isolation Forest"}

@app.get("/info")
def info():
    return {
        "model"     : "Isolation Forest",
        "threshold" : threshold,
        "n_features": 128,
        "description": "Détection d'anomalies sur métriques système (SMD)"
    }

@app.get("/features/{minute}")
def get_features(minute: int):
    """Fournit le vecteur de 128 features correspondant à une minute donnée."""
    if test_if_data is None:
        raise HTTPException(status_code=500, detail="Données test_if non disponibles")
    # minute entre 0 et 28419 (alignée avec labels, qui commence à 59 dans test_if)
    raw_idx = minute + 59 if minute < 28420 else minute
    if raw_idx < 0 or raw_idx >= len(test_if_data):
        raise HTTPException(status_code=400, detail=f"Minute {minute} hors limites (0 - {len(test_if_data)-60})")
    
    return {
        "minute": minute,
        "raw_index": raw_idx,
        "metrics": test_if_data[raw_idx].tolist()
    }

@app.post("/predict", response_model=PredictionOutput)
def predict(data: MetricsInput):

    if len(data.metrics) != 128:
        raise HTTPException(
            status_code=422,
            detail=f"128 features attendues, {len(data.metrics)} reçues."
        )

    X = np.array(data.metrics).reshape(1, -1)
    
    score = float(iso_forest.decision_function(X)[0])
    pred  = int(score < threshold)

    return PredictionOutput(
        prediction = pred,
        score      = round(score, 6),
        status     = "anomalie" if pred == 1 else "normal",
        message    = (
            "Dégradation détectée — intervention recommandée."
            if pred == 1 else
            "Système en fonctionnement normal."
        )
    )
