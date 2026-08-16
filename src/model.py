import os 
import numpy as np
import joblib

SAVE_DIR = os.path.join("outputs", "preprocessed")

print("="*60)
print("SECTION 1 : CHARGEMENT DES DONNÉES")
print("="*60)

X_train_if = np.load(os.path.join(SAVE_DIR, "X_train_if.npy"))
X_val_if = np.load(os.path.join(SAVE_DIR, "X_val_if.npy"))
test_if = np.load(os.path.join(SAVE_DIR, "test_if.npy"))

X_train_lstm = np.load(os.path.join(SAVE_DIR, "X_train_lstm.npy"))
X_val_lstm = np.load(os.path.join(SAVE_DIR, "X_val_lstm.npy"))
test_lstm = np.load(os.path.join(SAVE_DIR, "test_lstm.npy"))

labels = np.load(os.path.join(SAVE_DIR, "labels.npy"))

print(f"\nIsolation Forest :")
print(f"  X_train : {X_train_if.shape}")
print(f"  X_val   : {X_val_if.shape}")
print(f"  test    : {test_if.shape}")

print(f"\nAutoencoder LSTM :")
print(f"  X_train : {X_train_lstm.shape}")
print(f"  X_val   : {X_val_lstm.shape}")
print(f"  test    : {test_lstm.shape}")

print(f"\nLabels : {labels.shape}")
print(f"Anomalies : {labels.sum()} ({100*labels.sum()/len(labels):.1f}%)")


print("\n" + "="*60)
print("SECTION 2 : ISOLATION FOREST")
print("="*60)

from sklearn.ensemble import IsolationForest

print("\nEntraînement en cours...")
iso_forest = IsolationForest(
    n_estimators=100,
    contamination=0.095,
    random_state=42,
    n_jobs=-1
)
iso_forest.fit(X_train_if)
print("Entraînement terminé.")

scores_if = iso_forest.decision_function(test_if)
predictions_if = iso_forest.predict(test_if)

predictions_if = (predictions_if == -1).astype(int)

predictions_if_aligned = predictions_if[59:]
scores_if_aligned = scores_if[59:]

thresholds = [0.01, 0.02, 0.03, 0.04, 0.05, -0.05, -0.1, -0.15, -0.20]

from sklearn.metrics import f1_score, recall_score, precision_score

print(f"\n{'Seuil':>10} {'Rappel':>10} {'Précision':>10} {'F1':>10} {'Alertes':>10}")
print("-" * 55)

for thresh in thresholds :
    preds = (scores_if_aligned < thresh).astype(int)
    r = recall_score(labels, preds, zero_division=0)
    p = precision_score(labels, preds, zero_division=0)
    f1 = f1_score(labels, preds, zero_division=0)
    n = preds.sum()
    print(f"{thresh:>10.3f} {r:>10.3f} {p:>10.3f} {f1:>10.3f} {n:>10}")

print("\n" + "="*60)
print("SEUIL RETENU : -0.05")
print("="*60)

THRESHOLD_IF = -0.05
final_preds_if = (scores_if_aligned < THRESHOLD_IF).astype(int)

from sklearn.metrics import classification_report, confusion_matrix

print(f"\nRapport final Isolation Forest (seuil={THRESHOLD_IF}) :")
print(classification_report(labels, final_preds_if,
                            target_names=["Normal", "Anomalie"]))

print("Matrice de confusion :")
cm = confusion_matrix(labels, final_preds_if)
print(cm)
print(f"\nVrais positifs  : {cm[1][1]}")
print(f"Faux positifs   : {cm[0][1]}")
print(f"Faux négatifs   : {cm[1][0]}")
print(f"Vrais négatifs  : {cm[0][0]}")

# ─────────────────────────────────────────────
# SAUVEGARDE
# ─────────────────────────────────────────────
import joblib

MODEL_DIR = os.path.join("outputs", "models")
os.makedirs(MODEL_DIR, exist_ok=True)

joblib.dump(iso_forest, os.path.join(MODEL_DIR, "isolation_forest.pkl"))
np.save(os.path.join(MODEL_DIR, "threshold_if.npy"), np.array([THRESHOLD_IF]))

print(f"\nModèle sauvegardé dans {MODEL_DIR}/")
print(f"  isolation_forest.pkl")
print(f"  threshold_if.npy (seuil={THRESHOLD_IF})")








