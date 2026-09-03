import React, { useMemo } from 'react';
import { 
  BarChart3, 
  Flame, 
  AlertCircle, 
  CheckCircle2, 
  TrendingDown, 
  Repeat 
} from 'lucide-react';

export default function WindowStats({ metricsData, minute, windowSize = 500, threshold = -0.05 }) {
  const stats = useMemo(() => {
    if (!metricsData || !metricsData.scores || !metricsData.labels) {
      return {
        pctRealAnomalies: 0,
        pctAlerts: 0,
        avgScore: 0,
        maxConsecutiveAlerts: 0,
        windowLength: 0,
        start: 0,
        end: 0
      };
    }

    const total = metricsData.scores.length;
    const half = Math.floor(windowSize / 2);
    const startIdx = Math.max(0, minute - half);
    const endIdx = Math.min(total, minute + half);
    const len = endIdx - startIdx;

    if (len === 0) {
      return {
        pctRealAnomalies: 0,
        pctAlerts: 0,
        avgScore: 0,
        maxConsecutiveAlerts: 0,
        windowLength: 0,
        start: startIdx,
        end: endIdx
      };
    }

    let realAnomCount = 0;
    let alertsCount = 0;
    let sumScore = 0;
    let currentConsec = 0;
    let maxConsec = 0;

    for (let i = startIdx; i < endIdx; i++) {
      const isReal = metricsData.labels[i] === 1;
      const s = metricsData.scores[i];
      const isAlert = s < threshold;

      if (isReal) realAnomCount++;
      if (isAlert) {
        alertsCount++;
        currentConsec++;
        if (currentConsec > maxConsec) {
          maxConsec = currentConsec;
        }
      } else {
        currentConsec = 0;
      }

      sumScore += s;
    }

    return {
      pctRealAnomalies: (100 * realAnomCount) / len,
      pctAlerts: (100 * alertsCount) / len,
      avgScore: sumScore / len,
      maxConsecutiveAlerts: maxConsec,
      windowLength: len,
      start: startIdx,
      end: endIdx,
      realAnomCount,
      alertsCount
    };
  }, [metricsData, minute, windowSize, threshold]);

  const cards = [
    {
      label: "% Anomalies Réelles",
      value: `${stats.pctRealAnomalies.toFixed(1)}%`,
      subText: `${stats.realAnomCount} min sur ${stats.windowLength} min`,
      icon: AlertCircle,
      iconColor: stats.pctRealAnomalies > 0 ? "text-rose-400" : "text-slate-400",
      accent: stats.pctRealAnomalies > 0 ? "border-rose-500/30 bg-rose-500/5" : "border-slate-800 bg-slate-900/40"
    },
    {
      label: "% Alertes Générées",
      value: `${stats.pctAlerts.toFixed(1)}%`,
      subText: `${stats.alertsCount} min sous le seuil`,
      icon: Flame,
      iconColor: stats.pctAlerts > 0 ? "text-amber-400" : "text-slate-400",
      accent: stats.pctAlerts > 0 ? "border-amber-500/30 bg-amber-500/5" : "border-slate-800 bg-slate-900/40"
    },
    {
      label: "Score IF Moyen",
      value: stats.avgScore.toFixed(4),
      subText: stats.avgScore < threshold ? "Moyenne critique" : "Moyenne normale",
      icon: TrendingDown,
      iconColor: stats.avgScore < threshold ? "text-rose-400" : "text-indigo-400",
      accent: stats.avgScore < threshold ? "border-rose-500/30 bg-rose-500/5" : "border-slate-800 bg-slate-900/40"
    },
    {
      label: "Max Alertes Consécutives",
      value: `${stats.maxConsecutiveAlerts} min`,
      subText: stats.maxConsecutiveAlerts > 10 ? "Persistance anormale élevée" : "Dérives brèves ou isolées",
      icon: Repeat,
      iconColor: stats.maxConsecutiveAlerts > 15 ? "text-rose-400" : "text-sky-400",
      accent: stats.maxConsecutiveAlerts > 15 ? "border-rose-500/30 bg-rose-500/5" : "border-slate-800 bg-slate-900/40"
    }
  ];

  return (
    <div className="rounded-xl bg-slate-900/70 border border-slate-800/80 p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          Statistiques de la Fenêtre Affichée ({stats.start} à {stats.end} min)
        </h4>
        <span className="text-[11px] text-slate-400 font-mono">
          Échantillon: {stats.windowLength} minutes
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className={`p-3 rounded-lg border ${c.accent} transition-all`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs text-slate-400 line-clamp-1">{c.label}</span>
                <Icon className={`w-3.5 h-3.5 ${c.iconColor}`} />
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {c.value}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {c.subText}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
