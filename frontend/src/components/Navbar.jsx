import React from 'react';
import { 
  Activity, 
  Server, 
  Wifi, 
  WifiOff, 
  Cpu, 
  Sliders, 
  RotateCw,
  ShieldAlert
} from 'lucide-react';

export default function Navbar({ apiStatus, modelInfo, onRefreshHealth, isCheckingApi }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0B0F17]/90 backdrop-blur-md px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Project Identity */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent border border-indigo-500/30 text-indigo-400 shadow-lg shadow-indigo-500/10">
            <Server className="w-5 h-5 text-indigo-400" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0B0F17]"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Performance Degradation Prediction
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 rounded-full">
                AIOps
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Proactive anomaly detection on Server Machine Dataset (SMD) • <span className="text-slate-300 font-medium">machine-1-1</span>
            </p>
          </div>
        </div>

        {/* Status Indicators & Metadata */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 self-end md:self-auto">
          
          {/* Model info badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-inner">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-slate-200">{modelInfo?.model || 'Isolation Forest'}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Seuil:</span>
            <code className="text-indigo-300 font-mono font-semibold">{modelInfo?.threshold ?? -0.05}</code>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">{modelInfo?.n_features ?? 128} features</span>
          </div>

          {/* API Status Pill */}
          <div 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              apiStatus.online 
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 shadow-sm shadow-emerald-500/10' 
                : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            }`}
          >
            {apiStatus.online ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>API Connectée (:8000)</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span>API Déconnectée</span>
              </>
            )}

            <button
              onClick={onRefreshHealth}
              disabled={isCheckingApi}
              title="Tester la connexion API"
              className="ml-1 p-0.5 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
            >
              <RotateCw className={`w-3 h-3 ${isCheckingApi ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
