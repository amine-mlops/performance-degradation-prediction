import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine 
} from 'recharts';
import { Gauge, ShieldAlert, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function ScoreChart({
  metricsData,
  minute,
  windowSize = 500,
  threshold = -0.05
}) {
  const { chartData, minScore, maxScore, currentScore } = useMemo(() => {
    if (!metricsData || !metricsData.scores) {
      return { chartData: [], minScore: -0.4, maxScore: 0.2, currentScore: 0 };
    }

    const total = metricsData.scores.length;
    const half = Math.floor(windowSize / 2);
    const startIdx = Math.max(0, minute - half);
    const endIdx = Math.min(total, minute + half);

    const data = [];
    let min = 0;
    let max = 0;

    for (let i = startIdx; i < endIdx; i++) {
      const s = metricsData.scores[i];
      if (s < min) min = s;
      if (s > max) max = s;

      data.push({
        minute: i,
        score: s,
        threshold: threshold,
        isAlert: s < threshold
      });
    }

    const curr = metricsData.scores[minute] ?? 0;

    return {
      chartData: data,
      minScore: Math.min(min, -0.2),
      maxScore: Math.max(max, 0.1),
      currentScore: curr
    };
  }, [metricsData, minute, windowSize, threshold]);

  const isCurrentAlert = currentScore < threshold;

  return (
    <div className="rounded-xl bg-slate-900/70 border border-slate-800/80 p-5 shadow-lg">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                Score d'Anomalie Isolation Forest (décision)
              </h3>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono border ${
                isCurrentAlert 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                Score Actuel: {currentScore.toFixed(4)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Toute valeur sous la ligne rouge pointillée ({threshold}) déclenche une alerte de dégradation
            </p>
          </div>
        </div>

        {/* Legend pills */}
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-0.5 bg-indigo-400 inline-block rounded" />
            Score IF
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-rose-500 inline-block" />
            Seuil critique ({threshold})
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
              </linearGradient>
            </defs>

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
              domain={[minScore - 0.05, maxScore + 0.05]}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const scoreVal = Number(payload[0]?.value);
                  const isAnom = scoreVal < threshold;
                  return (
                    <div className="rounded-lg border border-slate-700 bg-slate-950/95 p-2.5 shadow-xl backdrop-blur-md text-xs font-mono">
                      <div className="text-slate-400 mb-1">Minute {label}</div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-indigo-300">Score IF:</span>
                        <span className={`font-bold ${isAnom ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {scoreVal.toFixed(6)}
                        </span>
                      </div>
                      <div className="text-[10px] mt-1 pt-1 border-t border-slate-800">
                        {isAnom ? '⚠️ En zone anomalie (< seuil)' : '✅ Comportement normal'}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Red Dashed Decision Threshold Line */}
            <ReferenceLine 
              y={threshold} 
              stroke="#ef4444" 
              strokeDasharray="4 4" 
              strokeWidth={2}
              label={{
                value: `Seuil critique: ${threshold}`,
                fill: "#f87171",
                fontSize: 11,
                position: "insideBottomRight",
                fontWeight: 600
              }}
            />

            {/* Current Minute Vertical Marker */}
            <ReferenceLine 
              x={minute} 
              stroke="#f97316" 
              strokeWidth={2}
              strokeDasharray="4 4"
            />

            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#818cf8" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#scoreGradient)" 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
