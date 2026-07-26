import os
import numpy as np
import pandas as pd
from data_loader import load_machine

OUTPUT_DIR = "outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)
train, test, labels = load_machine("machine-1-1")

print("="*60)
print("SECTION 1 : SÉLECTION DES FEATURES")
print("="*60)
print(f"\nDimensions initiales : {train.shape}")

const_train = [c for c in train.columns if train[c].nunique() == 1]
const_test = [c for c in test.columns if test[c].nunique() == 1]

to_drop = list(set(const_train) & set(const_test))
to_drop.sort()
print(f"\nColonnes constantes dans train ET test : {to_drop}")
print(f"→ Ces colonnes seront supprimées")

kept = list(set(const_train)-set(to_drop))
if kept:
    print(f"\nColonnes constantes dans train mais actives dans test : {kept}")
    print(f"→ Ces colonnes sont CONSERVÉES (potentiel signal d'anomalie)")

train_selected = train.drop(columns=to_drop)
test_selected = test.drop(columns=to_drop)

print(f"\nDimensions après sélection : {train_selected.shape}")
print(f"Métriques conservées : {train_selected.shape[1]}")

print("\n"+"="*60)
print("SECTION 2 : FENÊTRES TEMPORELLES (SLIDING WINDOWS)")
print("="*60)

WINDOW_SIZE = 60

def create_windows(data, window_size):
    n = len(data) - window_size + 1
    windows = np.zeros((n, window_size, data.shape[1]), dtype=np.float64)
    for i in range(n):
        windows[i] = data[i : i + window_size]
    return windows

print(train_selected.head(2))
print(train_selected.dtypes)

problematic = pd.to_numeric(train_selected["metric_5"], errors="coerce")
mask = problematic.isna()
print(f"Nombre de valeurs problématique : {mask.sum()}")
print(f"Exemples :")
print(train_selected["metric_5"][mask].unique())
 
train_selected["metric_5"] = pd.to_numeric(train_selected["metric_5"], errors="coerce")
print(f"NaN dans metric_5 apres conversion : {train_selected['metric_5'].isna().sum()}")

train_selected['metric_5'] = train_selected['metric_5'].ffill()
print(f"NaN restants : {train_selected['metric_5'].isna().sum()}")
print(f"Type : {train_selected['metric_5'].dtype}")

train_values = train_selected.astype(np.float64).values
test_values = test_selected.astype(np.float64).values
print(f"Type : {train_values.dtype}")
print(f"Dimensions : {train_values.shape}")

train_windows = create_windows(train_values, WINDOW_SIZE)
test_windows = create_windows(test_values, WINDOW_SIZE)

print(f"\nTrain:")
print(f"  Avant : {train_values.shape}")
print(f"  Apés : {train_windows.shape}")
print(f"\nTest:")
print(f"  Avant : {test_values.shape}")
print(f"  Apés : {test_windows.shape}")

labels_windows = labels["label"].values[WINDOW_SIZE - 1:]
print(f"\nLabels alignés : {labels_windows.shape}")
print(f"Anomalies : {labels_windows.sum()}")

print("\n" + "="*60)
print("SECTION 3 : FEATURE ENGINEERING")
print("="*60)

ROLLING_WINDOW = 19
def add_features(data):
    features = [data]

    rolling_mean = data.rolling(window=ROLLING_WINDOW, min_periods=1).mean()
    rolling_mean.columns = [f"{c}_mean" for c in data.columns]
    features.append(rolling_mean)

    rolling_std = data.rolling(window=ROLLING_WINDOW, min_periods=1).std().fillna(0)
    rolling_std.columns = [f"{c}_std" for c in data.columns]
    features.append(rolling_std)

    diff = data.diff().fillna(0)
    diff.columns = [f"{c}_diff" for c in data.columns]
    features.append(diff)

    return pd.concat(features, axis=1)

train_engineered = add_features(train_selected)
test_engineered = add_features(test_selected)

print(f"\nDimensions avant : {train_selected.shape}")
print(f"Dimensions aprés : {train_engineered.shape}")
print(f"\nExemple de nouvelles colonnes :")
print(train_engineered.columns.tolist()[30:36])

train_eng_values = train_engineered.astype(np.float64).values
test_eng_values = test_engineered.astype(np.float64).values

train_eng_windows = create_windows(train_eng_values, WINDOW_SIZE)
test_eng_winddows = create_windows(test_eng_values, WINDOW_SIZE)

print(f"\nFenêtres enrichies :")
print(f"  Train: {train_eng_windows.shape}")
print(f"  Test:  {test_eng_winddows.shape}")

print("\n" + "="*60)
print("SECTION 4 : NORMALISATION")
print("="*60)

from sklearn.preprocessing import StandardScaler

scaler_if = StandardScaler()
train_if = scaler_if.fit_transform(train_eng_values)
test_if = scaler_if.transform(test_eng_values)

print(f"\nPour Isolation Forest (2D) :")
print(f"  Train : {train_if.shape}")
print(f"  Test  : {test_if.shape}")
print(f"  Moyenne :  {train_if.mean():.4f}")
print(f"  Std     : {train_if.std():.4f}")

scaler_lstm = StandardScaler()
train_orig_scaled = scaler_lstm.fit_transform(train_selected.astype(np.float64).values)
test_orig_scaled = scaler_lstm.transform(test_selected.astype(np.float64).values)

train_lstm = create_windows(train_orig_scaled, WINDOW_SIZE)
test_lstm = create_windows(test_orig_scaled, WINDOW_SIZE)

print(f"\nPour Autoencoder LSTM (3D) :")
print(f"  Train : {train_lstm.shape}")
print(f"  Test  : {test_lstm.shape}")

print("\n" + "="*60)
print("SECTION 5 : DÉCOUPAGE TRAIN / VALIDATION")
print("="*60)

SPLIT = 0.8

split_if = int(len(train_if) * SPLIT)
X_train_if =  train_if[:split_if]
X_val_if = train_if[split_if:]

split_lstm = int(len(train_lstm) * SPLIT)
X_train_lstm = train_lstm[:split_lstm]
X_val_lstm = train_lstm[split_lstm:]

print(f"\nIsolation Forest : ")
print(f"  Train : {X_train_if.shape}")
print(f"  Val   : {X_val_if.shape} ")

print(f"\nAutoencoder LSTM :")
print(f"  Train : {X_train_lstm.shape}")
print(f"  Val   : {X_val_lstm.shape}")

print("\n" + "="*60)
print("SECTION 6 : SAUVEGARDE")
print("="*60)

import joblib

SAVE_DIR = os.path.join("outputs", "preprocessed")
os.makedirs(SAVE_DIR, exist_ok=True)

np.save(os.path.join(SAVE_DIR, "X_train_if.npy"), X_train_if)
np.save(os.path.join(SAVE_DIR, "X_val_if.npy"), X_val_if)
np.save(os.path.join(SAVE_DIR, "test_if.npy"), test_if)

np.save(os.path.join(SAVE_DIR, "X_train_lstm.npy"), X_train_lstm)
np.save(os.path.join(SAVE_DIR, "X_val_lstm.npy"), X_val_lstm)
np.save(os.path.join(SAVE_DIR, "test_lstm.npy"), test_lstm)

np.save(os.path.join(SAVE_DIR, "labels.npy"), labels_windows)

joblib.dump(scaler_if, os.path.join(SAVE_DIR, "scaler_if.pkl"))
joblib.dump(scaler_lstm, os.path.join(SAVE_DIR, "scaler_lstm.pkl"))

print(f"\nFichier sauvegardés dans {SAVE_DIR}/ :")
for f in os.listdir(SAVE_DIR):
    size = os.path.getsize(os.path.join(SAVE_DIR, f)) / 1024 / 1024
    print(f"{f} '{size:.1f} MB")