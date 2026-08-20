FROM python:3.12-slim

# Dossier de travail
WORKDIR /app

# Copier les dépendances
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code et les modèles
COPY src/ ./src/
COPY outputs/models/ ./outputs/models/
COPY outputs/preprocessed/scaler_if.pkl ./outputs/preprocessed/scaler_if.pkl

# Port exposé
EXPOSE 8000

# Lancer l'API
CMD ["uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8000"]