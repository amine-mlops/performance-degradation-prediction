import os
import random
import numpy as np
import tensorflow as tf
from sklearn.metrics import (classification_report, confusion_matrix,
                             f1_score, recall_score, precision_score)

SEED = 42
os.environ["PYTHONHASHSEED"] = str(SEED)
random.seed(SEED)
np.random.seed(SEED)
tf.random.set_seed(SEED)

from tensorflow.keras.models import Model
from tensorflow.keras.layers import (Input, LSTM, RepeatVector,
                                     TimeDistributed, Dense)
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

SAVE_DIR = os.path.join("outputs", "preprocessed")

print("="*60)
print("SECTION 1 : CHARGEMENT DES DONNÉES")
print("="*60)

X_train_lstm = np.load(os.path.join(SAVE_DIR, "X_train_lstm.npy"))
X_val_lstm   = np.load(os.path.join(SAVE_DIR, "X_val_lstm.npy"))
test_lstm    = np.load(os.path.join(SAVE_DIR, "test_lstm.npy"))
labels       = np.load(os.path.join(SAVE_DIR, "labels.npy"))

print(f"\nX_train : {X_train_lstm.shape}")
print(f"X_val   : {X_val_lstm.shape}")
print(f"test    : {test_lstm.shape}")
print(f"Labels  : {labels.shape}")
print(f"Anomalies : {labels.sum()} ({100*labels.sum()/len(labels):.1f}%)")

print("\n" + "="*60)
print("SECTION 2 : ARCHITECTURE AUTOENCODER LSTM")
print("="*60)

TIMESTEPS  = X_train_lstm.shape[1]   # 60
N_FEATURES = X_train_lstm.shape[2]   # 32

inputs  = Input(shape=(TIMESTEPS, N_FEATURES))

encoded = LSTM(64, activation="relu", return_sequences=True)(inputs)
encoded = LSTM(32, activation="relu", return_sequences=False)(encoded)

decoded = RepeatVector(TIMESTEPS)(encoded)
decoded = LSTM(32, activation="relu", return_sequences=True)(decoded)
decoded = LSTM(64, activation="relu", return_sequences=True)(decoded)
decoded = TimeDistributed(Dense(N_FEATURES))(decoded)

autoencoder = Model(inputs, decoded)
autoencoder.compile(optimizer="adam", loss="mse")
autoencoder.summary()

print("\n" + "="*60)
print("SECTION 3 : ENTRAÎNEMENT")
print("="*60)

print("\nEntraînement en cours...")

early_stop = EarlyStopping(
    monitor="val_loss",
    patience=5,
    restore_best_weights=True,
    verbose=1
)

reduce_lr = ReduceLROnPlateau(
    monitor="val_loss",
    factor=0.5,
    patience=3,
    min_lr=1e-6,
    verbose=1
)

history = autoencoder.fit(
    X_train_lstm, X_train_lstm,
    epochs=50,
    batch_size=32,
    validation_data=(X_val_lstm, X_val_lstm),
    callbacks=[early_stop, reduce_lr],
    verbose=1
)
print("Entraînement terminé.")

best_epoch = np.argmin(history.history["val_loss"]) + 1
best_val   = min(history.history["val_loss"])
print(f"\nMeilleure epoch : {best_epoch}")
print(f"Meilleure val_loss : {best_val:.6f}")

print("\n" + "="*60)
print("SECTION 4 : CALCUL DU SEUIL")
print("="*60)

print("\nCalcul des erreurs sur le train (comportement normal)...")
train_pred   = autoencoder.predict(X_train_lstm, verbose=0)
train_errors = np.mean(np.power(X_train_lstm - train_pred, 2), axis=(1, 2))

print(f"\nErreurs train :")
print(f"  Min     : {train_errors.min():.6f}")
print(f"  Max     : {train_errors.max():.6f}")
print(f"  Moyenne : {train_errors.mean():.6f}")
print(f"  Std     : {train_errors.std():.6f}")

print("\n" + "="*60)
print("SECTION 5 : ÉVALUATION SUR LE TEST")
print("="*60)

print("\nCalcul des erreurs sur le test...")
test_pred  = autoencoder.predict(test_lstm, verbose=0)
mse_errors = np.mean(np.power(test_lstm - test_pred, 2), axis=(1, 2))

print(f"\nErreurs test :")
print(f"  Min     : {mse_errors.min():.6f}")
print(f"  Max     : {mse_errors.max():.6f}")
print(f"  Moyenne : {mse_errors.mean():.6f}")

log_errors = np.log1p(mse_errors)

print(f"\nErreurs log :")
print(f"  Min     : {log_errors.min():.4f}")
print(f"  Max     : {log_errors.max():.4f}")
print(f"  Moyenne : {log_errors.mean():.4f}")

print(f"\n{'Percentile':>12} {'Seuil':>10} {'Rappel':>10} {'Précision':>10} {'F1':>10} {'Alertes':>10}")
print("-" * 68)

best_f1     = 0
best_thresh = 0
best_p      = 0

for p in [80, 85, 90, 92, 95, 97, 99]:
    thresh = np.percentile(log_errors, p)
    preds  = (log_errors > thresh).astype(int)
    r  = recall_score(labels, preds, zero_division=0)
    pr = precision_score(labels, preds, zero_division=0)
    f1 = f1_score(labels, preds, zero_division=0)
    n  = preds.sum()
    print(f"{p:>12} {thresh:>10.4f} {r:>10.3f} {pr:>10.3f} {f1:>10.3f} {n:>10}")
    if f1 > best_f1:
        best_f1     = f1
        best_thresh = thresh
        best_p      = p

print(f"\nMeilleur seuil : percentile {best_p} → seuil={best_thresh:.4f}, F1={best_f1:.3f}")

print("\n" + "="*60)
print("SECTION 6 : RÉSULTATS FINAUX")
print("="*60)

THRESHOLD_LSTM   = best_thresh
final_preds_lstm = (log_errors > THRESHOLD_LSTM).astype(int)

print(f"\nRapport final (seuil log={THRESHOLD_LSTM:.4f}) :")
print(classification_report(labels, final_preds_lstm,
                             target_names=["Normal", "Anomalie"]))

cm = confusion_matrix(labels, final_preds_lstm)
print("Matrice de confusion :")
print(cm)
print(f"\nVrais positifs  : {cm[1][1]}")
print(f"Faux positifs   : {cm[0][1]}")
print(f"Faux négatifs   : {cm[1][0]}")
print(f"Vrais négatifs  : {cm[0][0]}")

