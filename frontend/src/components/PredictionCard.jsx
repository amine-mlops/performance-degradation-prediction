import React from 'react';
import { 
  AlertOctagon, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Gauge, 
  Layers, 
  ShieldAlert, 
  Activity,
  ArrowRight,
  Clock
} from 'lucide-react';

export default function PredictionCard({ 
  prediction, 
  isLoading, 
  minute, 
  trueLabel, 
  threshold = -0.05 
}) {
  const isAnomaly = prediction?.prediction === 1;
  const isTrueAnomaly = trueLabel === 1;
  
  // Evaluation taxonomy
  let evalType = 'correct_neg'; // TN
  let evalLabel = 'Vrai Négatif (Normal)';
  let evalColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  let isCorrect = true;

  if (isAnomaly && isTrueAnomaly) {
    evalType = 'correct_pos'; // TP
    evalLabel = 'Vrai Positif (Dégradation interceptée)';
    evalColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    isCorrect = true;
  } else if (!isAnomaly && !isTrueAnomaly) {
    evalType = 'correct_neg'; // TN
    evalLabel = 'Vrai Négatif (Système sain)';
    evalColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    isCorrect = true;
  } else if (isAnomaly && !isTrueAnomaly) {
    evalType = 'false_pos'; // FP
    evalLabel = 'Fausse Alerte (Faux Positif)';
    evalColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    isCorrect = false;
  } else {
    evalType = 'false_neg'; // FN
    evalLabel = 'Panne Manquée (Faux Négatif)';
    evalColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    isCorrect = false;
  }

  const score = prediction?.score ?? 0;
  const delta = score - threshold;

  return (
    <div className={`relative overflow-hidden rounded-xl border p-5 transition-all shadow-xl ${
      isAnomaly 
        ? 'bg-gradient-to-b from-rose-950/30 via-slate-900/90 to-slate-900/90 border-rose-500/40 shadow-rose-950/20' 
        : 'bg-gradient-to-b from-emerald-950/30 via-slate-900/90 to-slate-900/90 border-emerald-500/40 shadow-emerald-950/20'
    }`}>
      {/* Glow highlight */}
      <div className={`absolute top-0 right-0 w-64 h-32 blur-3xl pointer-events-none rounded-full ${
        isAnomaly ? 'bg-rose-500/15' : 'bg-emerald-500/15'
      }`} />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg border ${
            isAnomaly ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
          }`}>
            {isAnomaly ? <AlertOctagon className="w-5 h-5 animate-pulse" /> : <CheckCircle className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                Inférence Minute {minute.toLocaleString()}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {prediction?.source === 'api' ? 'FastAPI :8000' : 'Local Engine'}
              </span>
              {isLoading && (
                <span className="text-xs text-indigo-400 animate-pulse flex items-center gap-1 font-medium">
                  <Activity className="w-3 h-3 animate-spin" /> Inférence...
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 mt-0.5">
              {isAnomaly ? (
                <span className="text-rose-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
                  ANOMALIE DÉTECTÉE
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  FONCTIONNEMENT NORMAL
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* Accuracy badge */}
        <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-semibold ${evalColor}`}>
          {isCorrect ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{evalLabel}</span>
        </div>
      </div>

      {/* Metrics breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        
        {/* Raw Score */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Gauge className="w-3.5 h-3.5 text-indigo-400" />
            <span>Score Isolation Forest</span>
          </div>
          <div className="text-lg font-bold font-mono text-white">
            {score.toFixed(6)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
            {delta < 0 ? (
              <span className="text-rose-400 font-semibold">{delta.toFixed(4)} (sous le seuil)</span>
            ) : (
              <span className="text-emerald-400 font-semibold">+{delta.toFixed(4)} (au-dessus)</span>
            )}
          </div>
        </div>

        {/* Decision Threshold */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Seuil Décisionnel</span>
          </div>
          <div className="text-lg font-bold font-mono text-indigo-300">
            {threshold.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Calibré pour Rappel à 91%
          </div>
        </div>

        {/* Ground Truth */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Vérité Terrain (SMD)</span>
          </div>
          <div className="text-lg font-bold flex items-center gap-1.5">
            {isTrueAnomaly ? (
              <span className="text-rose-400 font-bold flex items-center gap-1 text-sm sm:text-base">
                🔴 Anomalie Réelle
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center gap-1 text-sm sm:text-base">
                🟢 État Normal
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
            Label ground-truth: {trueLabel}
          </div>
        </div>

        {/* Accuracy Comparison */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>Précision Inférence</span>
          </div>
          <div className="text-lg font-bold flex items-center gap-1.5">
            {isCorrect ? (
              <span className="text-emerald-400 text-sm sm:text-base flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Prédiction Exacte
              </span>
            ) : (
              <span className="text-rose-400 text-sm sm:text-base flex items-center gap-1">
                <XCircle className="w-4 h-4" /> Erreur d'Alerte
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {isCorrect ? 'Aligné avec ground truth' : 'Divergence observée'}
          </div>
        </div>

      </div>

      {/* Message and Recommendation Banner */}
      <div className={`flex items-center gap-3 p-3 rounded-lg border text-xs sm:text-sm font-medium ${
        isAnomaly 
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-200' 
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
      }`}>
        <div className="shrink-0">
          {isAnomaly ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
        </div>
        <p className="flex-1">
          {prediction?.message || (
            isAnomaly 
              ? 'Dégradation détectée — intervention recommandée sur les métriques critiques.' 
              : 'Système en fonctionnement normal.'
          )}
        </p>
        <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-slate-900/80 text-slate-400 border border-slate-700/50">
          POST /predict
        </span>
      </div>
    </div>
  );
}
