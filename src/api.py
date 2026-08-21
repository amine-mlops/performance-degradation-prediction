import os
import numpy as np
import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

MODEL_DIR = os.path.join("outputs", "models")
PREP_DIR  = os.path.join("outputs", "preprocessed")

iso_forest  = joblib.load(os.path.join(MODEL_DIR, "isolation_forest.pkl"))
scaler_if   = joblib.load(os.path.join(PREP_DIR,  "scaler_if.pkl"))
threshold   = float(np.load(os.path.join(MODEL_DIR, "threshold_if.npy"))[0])

print(f"Modèle chargé. Seuil : {threshold}")

app = FastAPI(
    title="API de détection de dégradation de performance",
    description="Prédit si un système IT est en dégradation à partir de ses métriques",
    version="1.0.0"
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