import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine, 
  ReferenceArea 
} from 'recharts';
import { Eye, EyeOff, Activity, AlertTriangle } from 'lucide-react';

export default function TimeSeriesChart({
  metricsData,
  minute,
  windowSize = 500,
  showAnomalies = true
}) {
  const [visibleLines, setVisibleLines] = useState({
    metric_0: true,
    metric_1: true,
    metric_5: true,
    metric_22: true
  });

  const toggleLine = (key) => {
    setVisibleLines(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Compute slice data
  const { chartData, anomalyIntervals, start, end } = useMemo(() => {
    if (!metricsData || !metricsData.m0) {
      return { chartData: [], anomalyIntervals: [], start: 0, end: 0 };
    }

    const total = metricsData.m0.length;
    const half = Math.floor(windowSize / 2);
    const startIdx = Math.max(0, minute - half);
    const endIdx = Math.min(total, minute + half);

    const data = [];
    const rawAnomalies = [];

    for (let i = startIdx; i < endIdx; i++) {
      const isAnom = metricsData.labels[i] === 1;
      data.push({
        minute: i,
        metric_0: metricsData.m0[i],
        metric_1: metricsData.m1[i],
        metric_5: metricsData.m5[i],
        metric_22: metricsData.m22[i],
        isAnomaly: isAnom
      });
      if (isAnom) {
        rawAnomalies.push(i);
      }
    }

    // Merge contiguous anomaly points into intervals for ReferenceArea
    const intervals = [];
    if (rawAnomalies.length > 0) {
      let intervalStart = rawAnomalies[0];
      let prev = rawAnomalies[0];

      for (let j = 1; j < rawAnomalies.length; j++) {
        const curr = rawAnomalies[j];
        if (curr === prev + 1) {
          prev = curr;
        } else {
          intervals.push({ x1: intervalStart, x2: prev + 1 });
          intervalStart = curr;
          prev = curr;
        }
      }
      intervals.push({ x1: intervalStart, x2: prev + 1 });
    }

    return {
      chartData: data,
      anomalyIntervals: intervals,
      start: startIdx,
      end: endIdx
    };
  }, [metricsData, minute, windowSize]);

  const metricConfigs = [
    { key: "metric_0", label: "Metric 0", color: "#38bdf8", role: "Charge CPU globale" },
    { key: "metric_1", label: "Metric 1", color: "#34d399", role: "Utilisation Mémoire" },
    { key: "metric_5", label: "Metric 5", color: "#fbbf24", role: "Entrées/Sorties Disque (I/O)" },
    { key: "metric_22", label: "Metric 22", color: "#a78bfa", role: "Trafic Réseau & Interrupts" },
  ];

  return (
    <div className="rounded-xl bg-slate-900/70 border border-slate-800/80 p-5 shadow-lg">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Visualisation Temporelle des Métriques Multivariées
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
              Fenêtre: {start.toLocaleString()} à {end.toLocaleString()} min ({chartData.length} pts)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            4 métriques normalisées clés • Zones rouges = anomalies réelles • Ligne orange = minute actuelle ({minute})
          </p>
        </div>

        {/* Legend / Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {metricConfigs.map(m => (
            <button
              key={m.key}
              onClick={() => toggleLine(m.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                visibleLines[m.key]
                  ? 'bg-slate-800 border-slate-700 text-white shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 opacity-60'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
              <span>{m.label}</span>
              {visibleLines[m.key] ? <Eye className="w-3 h-3 text-slate-400" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
            </button>
          ))}
        </div>
      </div>

      {/* Recharts Container */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
            <XAxis 
              dataKey="minute" 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false}
              tickFormatter={(v) => `${v}m`}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false}
              domain={['auto', 'auto']}
            />
            
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const isAnom = payload[0]?.payload?.isAnomaly;
                  return (
                    <div className="rounded-lg border border-slate-700 bg-slate-950/95 p-3 shadow-xl backdrop-blur-md text-xs">
                      <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-slate-800">
                        <span className="font-bold text-white font-mono">Minute {label}</span>
                        {isAnom ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            🔴 Anomalie Réelle
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            🟢 Normal
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 font-mono">
                        {payload.map((entry, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              {entry.name}:
                            </span>
                            <span className="font-semibold text-white">
                              {Number(entry.value).toFixed(4)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Red Shaded Zones for True Anomaly Periods */}
            {showAnomalies && anomalyIntervals.map((interval, idx) => (
              <ReferenceArea
                key={`anom-${idx}`}
                x1={interval.x1}
                x2={interval.x2}
                fill="#ef4444"
                fillOpacity={0.18}
                stroke="#ef4444"
                strokeOpacity={0.4}
                strokeDasharray="2 2"
              />
            ))}

            {/* Orange Vertical Line for Current Minute */}
            <ReferenceLine 
              x={minute} 
              stroke="#f97316" 
              strokeWidth={2}
              strokeDasharray="4 4"
              label={{
                value: `Actuel: ${minute}m`,
                fill: "#f97316",
                fontSize: 11,
                position: "top",
                fontWeight: 600
              }}
            />

            {/* Metric Lines */}
            {metricConfigs.map(m => (
              visibleLines[m.key] && (
                <Line
                  key={m.key}
                  type="monotone"
                  dataKey={m.key}
                  name={m.label}
                  stroke={m.color}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
