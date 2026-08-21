import streamlit as st
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import requests
import os
from sklearn.metrics import precision_score, recall_score, f1_score

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────
API_URL  = "http://localhost:8000"
SAVE_DIR = os.path.join("outputs", "preprocessed")
MODEL_DIR = os.path.join("outputs", "models")

st.set_page_config(
    page_title="Détection de dégradation IT",
    page_icon="🖥️",
    layout="wide"
)

# ─────────────────────────────────────────────
# CHARGEMENT DES DONNÉES
# ─────────────────────────────────────────────
@st.cache_data
def load_data():
    test_if = np.load(os.path.join(SAVE_DIR, "test_if.npy"))
    labels  = np.load(os.path.join(SAVE_DIR, "labels.npy"))
    return test_if, labels

@st.cache_data
def compute_all_scores(test_if):
    """Calcule les scores pour toutes les minutes du test."""
    import joblib
    iso_forest = joblib.load(os.path.join(MODEL_DIR, "isolation_forest.pkl"))
    scores = iso_forest.decision_function(test_if)
    return scores

test_if, labels = load_data()
all_scores = compute_all_scores(test_if)
threshold  = float(np.load(os.path.join(MODEL_DIR, "threshold_if.npy"))[0])
all_preds  = (all_scores < threshold).astype(int)
all_preds_aligned = all_preds[59:]

# ─────────────────────────────────────────────
# TITRE
# ─────────────────────────────────────────────
st.title("🖥️ Système de Détection de Dégradation de Performance")
st.markdown("---")

# ─────────────────────────────────────────────
# SIDEBAR
# ─────────────────────────────────────────────
st.sidebar.title("⚙️ Paramètres")
minute = st.sidebar.slider(
    "Minute à analyser",
    min_value=59,
    max_value=len(test_if) - 1,
    value=16000,
    step=1
)
window_size = st.sidebar.selectbox(
    "Fenêtre d'affichage",
    options=[200, 500, 1000, 2000],
    index=1
)
show_anomalies = st.sidebar.checkbox("Afficher les zones d'anomalie", value=True)
show_scores    = st.sidebar.checkbox("Afficher les scores IF", value=True)

# Bouton aller à la prochaine anomalie
if st.sidebar.button("⏭️ Prochaine anomalie"):
    anomaly_minutes = np.where(labels == 1)[0] + 59
    next_anom = anomaly_minutes[anomaly_minutes > minute]
    if len(next_anom) > 0:
        minute = int(next_anom[0])
        st.sidebar.success(f"Minute {minute}")

# ─────────────────────────────────────────────
# SECTION 1 : KPIs GLOBAUX
# ─────────────────────────────────────────────
st.subheader("📊 Performance globale du modèle")

col1, col2, col3, col4, col5 = st.columns(5)

total_anomalies  = labels.sum()
detected         = ((all_preds_aligned == 1) & (labels == 1)).sum()
false_positives  = ((all_preds_aligned == 1) & (labels == 0)).sum()
missed           = ((all_preds_aligned == 0) & (labels == 1)).sum()

recall    = recall_score(labels, all_preds_aligned, zero_division=0)
precision = precision_score(labels, all_preds_aligned, zero_division=0)
f1        = f1_score(labels, all_preds_aligned, zero_division=0)

with col1:
    st.metric("Rappel", f"{recall:.2%}", help="% de vraies pannes détectées")
with col2:
    st.metric("Précision", f"{precision:.2%}", help="% d'alertes qui sont vraies")
with col3:
    st.metric("F1-Score", f"{f1:.2f}")
with col4:
    st.metric("Pannes détectées", f"{detected}/{total_anomalies}")
with col5:
    st.metric("Fausses alertes", f"{false_positives}")

st.markdown("---")

# ─────────────────────────────────────────────
# SECTION 2 : ANALYSE EN TEMPS RÉEL
# ─────────────────────────────────────────────
st.subheader("🔍 Analyse de la minute sélectionnée")

current_metrics = test_if[minute].tolist()

try:
    response = requests.post(
        f"{API_URL}/predict",
        json={"metrics": current_metrics},
        timeout=5
    )
    result = response.json()

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        status_color = "🔴" if result["prediction"] == 1 else "🟢"
        st.metric("Statut prédit", f"{status_color} {result['status'].upper()}")
    with col2:
        st.metric("Score d'anomalie", f"{result['score']:.4f}",
                  delta=f"seuil: {threshold:.4f}")
    with col3:
        true_label = "🔴 Anomalie" if labels[minute - 59] == 1 else "🟢 Normal"
        st.metric("Vraie valeur", true_label)
    with col4:
        correct = (result["prediction"] == labels[minute - 59])
        st.metric("Prédiction", "✅ Correcte" if correct else "❌ Incorrecte")

    if result["prediction"] == 1:
        st.error(f"⚠️ {result['message']}")
    else:
        st.success(f"✅ {result['message']}")

except Exception as e:
    st.warning(f"API non disponible : {e}")

st.markdown("---")

# ─────────────────────────────────────────────
# SECTION 3 : GRAPHIQUES
# ─────────────────────────────────────────────
st.subheader("📈 Visualisation temporelle")

start = max(0,   minute - window_size // 2)
end   = min(len(test_if), minute + window_size // 2)

metrics_idx   = [0, 1, 5, 22]
metrics_names = ["metric_0", "metric_1", "metric_5", "metric_22"]

n_plots = len(metrics_idx) + (1 if show_scores else 0)
fig     = plt.figure(figsize=(14, 3 * n_plots))
gs      = gridspec.GridSpec(n_plots, 1, hspace=0.4)

for i, (idx, name) in enumerate(zip(metrics_idx, metrics_names)):
    ax     = fig.add_subplot(gs[i])
    values = test_if[start:end, idx]
    ax.plot(range(start, end), values, linewidth=0.7, color="#1D5C96", label=name)

    if show_anomalies:
        lab_start = max(0, start - 59)
        lab_end   = max(0, end - 59)
        lab_slice = labels[lab_start:lab_end]
        for j, l in enumerate(lab_slice):
            if l == 1:
                ax.axvspan(start + j, start + j + 1, color="#D64545", alpha=0.15)

    ax.axvline(minute, color="orange", linestyle="--", linewidth=1.5, label="minute actuelle")
    ax.set_ylabel(name, fontsize=9)
    ax.grid(True, alpha=0.3)
    if i == 0:
        ax.legend(loc="upper right", fontsize=8)

# Graphique des scores IF
if show_scores:
    ax_score = fig.add_subplot(gs[len(metrics_idx)])
    scores_window = all_scores[start:end]
    ax_score.plot(range(start, end), scores_window,
                  linewidth=0.7, color="#7F77DD", label="Score IF")
    ax_score.axhline(threshold, color="red", linestyle="--",
                     linewidth=1, label=f"Seuil ({threshold})")
    ax_score.fill_between(range(start, end), scores_window, threshold,
                          where=(scores_window < threshold),
                          color="#D64545", alpha=0.2, label="Zone anomalie")
    ax_score.axvline(minute, color="orange", linestyle="--", linewidth=1.5)
    ax_score.set_ylabel("Score IF", fontsize=9)
    ax_score.legend(loc="upper right", fontsize=8)
    ax_score.grid(True, alpha=0.3)

axes_list = fig.get_axes()
axes_list[-1].set_xlabel("Temps (minutes)")
plt.suptitle("Métriques du serveur — ligne orange = minute analysée", fontsize=11)
st.pyplot(fig)
plt.close()

st.markdown("---")

# ─────────────────────────────────────────────
# SECTION 4 : STATISTIQUES SUR LA FENÊTRE
# ─────────────────────────────────────────────
st.subheader("📉 Statistiques sur la fenêtre affichée")

lab_start_w = max(0, start - 59)
lab_end_w   = max(0, end - 59)
labels_w    = labels[lab_start_w:lab_end_w]
preds_w     = all_preds_aligned[lab_start_w:lab_end_w]

col1, col2, col3, col4 = st.columns(4)

with col1:
    pct_anom = 100 * labels_w.sum() / len(labels_w) if len(labels_w) > 0 else 0
    st.metric("% Anomalies réelles", f"{pct_anom:.1f}%")
with col2:
    pct_alerte = 100 * preds_w.sum() / len(preds_w) if len(preds_w) > 0 else 0
    st.metric("% Alertes générées", f"{pct_alerte:.1f}%")
with col3:
    score_mean = all_scores[start:end].mean()
    st.metric("Score IF moyen", f"{score_mean:.4f}")
with col4:
    consec = 0
    max_consec = 0
    for p in preds_w:
        if p == 1:
            consec += 1
            max_consec = max(max_consec, consec)
        else:
            consec = 0
    st.metric("Max alertes consécutives", f"{max_consec} min")

st.markdown("---")

# ─────────────────────────────────────────────
# SECTION 5 : HISTORIQUE DES ANOMALIES
# ─────────────────────────────────────────────
st.subheader("🚨 Périodes d'anomalie détectées")

anomaly_minutes = np.where(labels == 1)[0]
if len(anomaly_minutes) > 0:
    changes   = np.diff(np.concatenate([[0], labels, [0]]))
    starts_a  = np.where(changes == 1)[0]
    ends_a    = np.where(changes == -1)[0]

    rows = []
    for s, e in zip(starts_a, ends_a):
        preds_period = all_preds_aligned[s:e]
        detected_p   = preds_period.sum()
        rows.append({
            "Début (min)"     : s + 59,
            "Fin (min)"       : e + 59,
            "Durée (min)"     : e - s,
            "Points détectés" : int(detected_p),
            "Total points"    : int(e - s),
            "Taux détection"  : f"{100*detected_p/(e-s):.0f}%"
        })

    df = pd.DataFrame(rows)
    st.dataframe(df, use_container_width=True)
else:
    st.info("Aucune anomalie dans les données.")

st.markdown("---")
