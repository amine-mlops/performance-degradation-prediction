import React from 'react';
import { 
  AlertTriangle, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Target, 
  Sparkles,
  Layers
} from 'lucide-react';

export default function AnomalyTable({ periods = [], currentMinute, onSelectMinute }) {
  return (
    <div className="rounded-xl bg-slate-900/70 border border-slate-800/80 p-5 shadow-lg">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Historique des Périodes d'Anomalie (SMD)
            </h3>
            <p className="text-xs text-slate-400">
              Audit détaillé des 8 plages d'incidents réels avec performance de détection d'Isolation Forest
            </p>
          </div>
        </div>

        <span className="text-xs font-medium text-slate-400 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 self-start sm:self-auto">
          8 Périodes Répertoriées • Cliquez pour centrer
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="pb-3 pl-3">Période</th>
              <th className="pb-3">Début (min)</th>
              <th className="pb-3">Fin (min)</th>
              <th className="pb-3">Durée</th>
              <th className="pb-3">Points Détectés</th>
              <th className="pb-3">Total Points</th>
              <th className="pb-3">Taux Détection</th>
              <th className="pb-3 pr-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {periods.map((p) => {
              const isCurrent = currentMinute >= p.startMinute && currentMinute <= p.endMinute;
              const rate = p.detectionRate;

              let rateColor = "text-rose-400";
              let barColor = "bg-rose-500";
              if (rate >= 90) {
                rateColor = "text-emerald-400";
                barColor = "bg-emerald-500";
              } else if (rate >= 80) {
                rateColor = "text-indigo-400";
                barColor = "bg-indigo-500";
              } else if (rate > 0) {
                rateColor = "text-amber-400";
                barColor = "bg-amber-500";
              }

              return (
                <tr 
                  key={p.id}
                  className={`group transition-all hover:bg-slate-800/40 ${
                    isCurrent ? 'bg-rose-500/10 border-l-2 border-rose-500' : ''
                  }`}
                >
                  {/* Period badge */}
                  <td className="py-3 pl-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] border ${
                        isCurrent 
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' 
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        Panne #{p.id}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-rose-400">
                          ● En cours
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Start Minute */}
                  <td className="py-3 font-mono text-slate-300">
                    {p.startMinute.toLocaleString()} m
                  </td>

                  {/* End Minute */}
                  <td className="py-3 font-mono text-slate-300">
                    {p.endMinute.toLocaleString()} m
                  </td>

                  {/* Duration */}
                  <td className="py-3 font-mono text-slate-300">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {p.duration} min {p.duration >= 60 ? `(~${(p.duration/60).toFixed(1)}h)` : ''}
                    </span>
                  </td>

                  {/* Detected Points */}
                  <td className="py-3 font-mono font-bold text-white">
                    {p.detectedPoints.toLocaleString()}
                  </td>

                  {/* Total Points */}
                  <td className="py-3 font-mono text-slate-400">
                    {p.totalPoints.toLocaleString()}
                  </td>

                  {/* Detection Rate & Progress Bar */}
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <span className={`font-mono font-bold ${rateColor}`}>
                        {rate.toFixed(1)}%
                      </span>
                    </div>
                  </td>

                  {/* Jump Button */}
                  <td className="py-3 pr-3 text-right">
                    <button
                      onClick={() => onSelectMinute(p.startMinute + Math.min(10, Math.floor(p.duration / 2)))}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-all group-hover:border-indigo-500/50"
                    >
                      <span>Centrer</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>

                </tr>
              );
            })}
          </tbody>

          {/* Table Footer with Summary */}
          <tfoot>
            <tr className="border-t border-slate-700/80 bg-slate-950/40 text-slate-300 font-semibold font-mono">
              <td className="py-3 pl-3">Total Global</td>
              <td className="py-3 text-slate-400">—</td>
              <td className="py-3 text-slate-400">—</td>
              <td className="py-3">2 694 min</td>
              <td className="py-3 text-emerald-400 font-bold">2 446 min</td>
              <td className="py-3">2 694 min</td>
              <td className="py-3 text-emerald-400 font-bold">90.8% Rappel</td>
              <td className="py-3 pr-3 text-right text-slate-400">8 incidents</td>
            </tr>
          </tfoot>
        </table>
      </div>

    </div>
  );
}
