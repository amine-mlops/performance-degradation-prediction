import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from data_loader import load_machine

OUTPUT_DIR = "outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

train, test, labels = load_machine("machine-1-1")

print("="*60)
print("SECTION 1 : QUALITÉ DES DONNÉES")
print("="*60)

print(f"\nDimensions train : {train.shape}")
print(f"\nDimensions test : {test.shape}")

print(f"\nValeurs manquantes (train) : {train.isnull().sum().sum()}")
print(f"\nValeurs manquantes (test) : {test.isnull().sum().sum()}")

constant_cols1 = [col for col in train.columns if train[col].nunique() == 1]
print(f"\nColonnes constantes (train) : {len(constant_cols1)}")
if constant_cols1:
    print(f"   -> {constant_cols1}")

constant_cols2 = [col for col in test.columns if test[col].nunique() == 1]
print(f"\nColonnes constantes (test) : {len(constant_cols2)}")
if constant_cols2:
    print(f"   -> {constant_cols2}")

print("="*60)
print("SECTION 2 : STATISTIQUES DESCRIPTIVES")
print("="*60)

stats = train.describe().T
print("\nStatistiques des métriques (train) :")
print(stats[['mean','std', 'min', 'max']].round(3))

stats.to_csv(os.path.join(OUTPUT_DIR, "stats_train.csv"))
print(f"\nStatistiques complètes sauvegardées dans {OUTPUT_DIR}/stats_train.csv")

print("\n" + "="*60)
print("SECTION 3 : VISUALISATION DES MÉTRIQUES")
print("="*60)

metrics_to_plot = ["metric_22", "metric_5", "metric_6", "metric_15"]

fig, axes = plt.subplots(len(metrics_to_plot), 1, figsize=(14, 10), sharex=True)

for ax, metric in zip(axes, metrics_to_plot):
    ax.plot(train[metric].values, linewidth=0.6, color="#1D5C96")
    ax.set_ylabel(metric)
    ax.grid(True, alpha=0.3)

axes[0].set_title("Comportement de quelques métriques dans le train (comportement normal)")
axes[-1].set_xlabel("Temps (minutes)")

plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, "metric_train.png"), dpi=110)
plt.close()
print(f"\nGraphique sauvegardé dans {OUTPUT_DIR}/metrics_train.png")

print("\n" + "="*60)
print("SECTION 4 : ANALYSE DES ANOMALIES")
print("="*60)

lab = labels["label"].values

n_total = len(lab)
n_anom = int(lab.sum())
pct = 100 * n_anom/n_total

print(f"\nTotal de points  : {n_total}")
print(f"Points anormaux    : {n_anom} ({pct:.1f}%)")
print(f"Points normaux     : {n_total - n_anom} ({100-pct:.1f}%)")

changes = np.diff(np.concatenate([[0], lab, [0]]))
starts = np.where(changes == 1)[0]
ends = np.where(changes == -1)[0]

print(f"\nNombre de périodes d'anomalie distinctes : {len(starts)}")
print("\nDétail des périodes :")
for i, (s, e) in enumerate(zip(starts, ends), 1):
    print(f" Période {i} : minute {s} a {e} (durée : {e-s} min)")

metrics_anom = ["metric_22", "metric_5", "metric_6", "metric_15"]

fig, axes = plt.subplots(len(metrics_anom), 1, figsize=(14,10), sharex=True)

for ax, metric in zip(axes, metrics_anom):
    ax.plot(test[metric].values, linewidth=0.6, color="#1D5C96")
    for s, e in zip(starts, ends):
        ax.axvspan(s, e, color="#D64545", alpha=0.2)
    ax.set_ylabel(metric)
    ax.grid(True, alpha=0.3)

axes[0].set_title("Métriques du test avec zones d'anomalie (en rouge)")
axes[-1].set_xlabel("Temps (minutes)")

plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, "anomalies_test.png"), dpi=110)
plt.close() 
print(f"\nGraphique des anomalies sauvegardé dans {OUTPUT_DIR}/anomalies_test.png")

print("\n" + "="*60)
print("SECTION 5 : CORRÉLATIONS ENTRE MÉTRIQUES")
print("="*60)

active_cols = [col for col in train.columns if train[col].nunique()>1]
corr = train[active_cols].corr()

plt.figure(figsize=(14,12))
sns.heatmap(corr, cmap="coolwarm", center=0, square=True, 
            linewidths=0.5, cbar_kws={"shrink":0.8})
plt.title("Matrice de corrélation des métriques actives (train)")
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, "correlation_heatmap.png"), dpi=110)
plt.close()

print(f"\nHeatmap sauvefardée dans {OUTPUT_DIR}/correclation_heatmap.png")

