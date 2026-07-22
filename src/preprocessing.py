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








                   