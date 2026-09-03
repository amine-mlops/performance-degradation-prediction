import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  FastForward, 
  Rewind, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Play, 
  Eye, 
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function MinuteSelector({
  minute,
  totalMinutes = 28420,
  windowSize,
  setWindowSize,
  onChangeMinute,
  onNextAnomaly,
  onPrevAnomaly,
  anomalyPeriods = [],
  showAnomalies,
  setShowAnomalies,
  showScore,
  setShowScore
}) {
  const [inputValue, setInputValue] = useState(minute.toString());

  useEffect(() => {
    setInputValue(minute.toString());
  }, [minute]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(inputValue, 10);
    if (!isNaN(val)) {
      const clamped = Math.max(0, Math.min(totalMinutes - 1, val));
      onChangeMinute(clamped);
      setInputValue(clamped.toString());
    }
  };

  return (
    <div className="rounded-xl bg-slate-900/70 border border-slate-800/80 p-5 shadow-lg">
      
      {/* Top row with Title and Quick Anomaly Jumps */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800/80">
        
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Navigation Temporelle Multivariée
            </h3>
            <p className="text-xs text-slate-400">
              Déplacez le curseur pour explorer les 28 420 minutes (~5 semaines) de métriques
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Previous Anomaly Button */}
          <button
            onClick={onPrevAnomaly}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all shadow-sm active:scale-95"
            title="Sauter à l'anomalie précédente"
          >
            <Rewind className="w-3.5 h-3.5 text-rose-400" />
            <span>Précédente</span>
          </button>

          {/* Next Anomaly Button */}
          <button
            onClick={onNextAnomaly}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border border-rose-500/40 text-xs font-semibold transition-all shadow-md shadow-rose-900/30 active:scale-95"
            title="Sauter à la prochaine anomalie réelle"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>⏭️ Prochaine Anomalie</span>
          </button>

          {/* Window size selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-lg p-1">
            <span className="text-[11px] text-slate-400 pl-2 font-medium">Fenêtre:</span>
            {[200, 500, 1000].map((size) => (
              <button
                key={size}
                onClick={() => setWindowSize(size)}
                className={`px-2.5 py-1 rounded text-xs font-semibold font-mono transition-all ${
                  windowSize === size
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                {size}m
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* Main Slider and Input row */}
      <div className="space-y-4">
        
        {/* Slider with timeline markers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Position dans la séquence de test:</span>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                Minute sélectionnée: <strong className="text-indigo-400 font-mono text-sm">{minute.toLocaleString()}</strong> / {(totalMinutes - 1).toLocaleString()}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                Jour {Math.floor(minute / (60 * 24)) + 1}, {Math.floor((minute % (60 * 24)) / 60)}h{minute % 60 < 10 ? '0' : ''}{minute % 60}
              </span>
            </div>
          </div>

          <div className="relative pt-1 pb-1">
            <input
              type="range"
              min="0"
              max={totalMinutes - 1}
              value={minute}
              onChange={(e) => onChangeMinute(parseInt(e.target.value, 10))}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />

            {/* Visual anomaly tick marks along the slider timeline */}
            <div className="relative w-full h-2 mt-1 pointer-events-none">
              {anomalyPeriods.map((p) => {
                const leftPct = (p.startMinute / totalMinutes) * 100;
                const widthPct = Math.max(0.4, (p.duration / totalMinutes) * 100);
                return (
                  <div
                    key={p.id}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    className="absolute top-0 h-1.5 bg-rose-500/70 rounded-sm"
                    title={`Période ${p.id}: min ${p.startMinute} à ${p.endMinute}`}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0m (Début Test)</span>
            <span className="text-rose-400/80">▲ 5 Périodes majeures de pannes (15k - 21k min)</span>
            <span>28 420m (~5 semaines)</span>
          </div>
        </div>

        {/* Stepper buttons & Numeric Direct Jump */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          
          {/* Steppers */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onChangeMinute(Math.max(0, minute - 500))}
              className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-xs font-mono transition-colors"
            >
              -500m
            </button>
            <button
              onClick={() => onChangeMinute(Math.max(0, minute - 50))}
              className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-xs font-mono transition-colors"
            >
              -50m
            </button>
            <button
              onClick={() => onChangeMinute(Math.max(0, minute - 1))}
              className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
              title="-1 min"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <form onSubmit={handleInputSubmit} className="flex items-center gap-1 mx-1">
              <input
                type="number"
                min="0"
                max={totalMinutes - 1}
                value={inputValue}
                onChange={handleInputChange}
                className="w-24 px-2 py-1 text-center font-mono text-xs rounded bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
              >
                Aller
              </button>
            </form>

            <button
              onClick={() => onChangeMinute(Math.min(totalMinutes - 1, minute + 1))}
              className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
              title="+1 min"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChangeMinute(Math.min(totalMinutes - 1, minute + 50))}
              className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-xs font-mono transition-colors"
            >
              +50m
            </button>
            <button
              onClick={() => onChangeMinute(Math.min(totalMinutes - 1, minute + 500))}
              className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-xs font-mono transition-colors"
            >
              +500m
            </button>
          </div>

          {/* Quick incident shortcuts */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Sauts rapides:</span>
            {anomalyPeriods.slice(0, 5).map((p) => (
              <button
                key={p.id}
                onClick={() => onChangeMinute(p.startMinute + 10)}
                className={`px-2 py-1 rounded text-[11px] font-medium border transition-all ${
                  minute >= p.startMinute && minute <= p.endMinute
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-semibold'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                }`}
              >
                P{p.id} ({p.detectionRate}%)
              </button>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
