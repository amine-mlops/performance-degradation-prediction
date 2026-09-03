import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import KpiCards from './components/KpiCards';
import MinuteSelector from './components/MinuteSelector';
import PredictionCard from './components/PredictionCard';
import TimeSeriesChart from './components/TimeSeriesChart';
import ScoreChart from './components/ScoreChart';
import WindowStats from './components/WindowStats';
import AnomalyTable from './components/AnomalyTable';
import { 
  checkApiHealth, 
  fetchModelInfo, 
  loadSummaryData, 
  loadFeaturesBuffer, 
  getMetricVector, 
  postPredict 
} from './services/api';
import { Activity, Server, AlertOctagon, RefreshCw } from 'lucide-react';

export default function App() {
  const [data, setData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);

  // API State
  const [apiStatus, setApiStatus] = useState({ online: false, error: null });
  const [isCheckingApi, setIsCheckingApi] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);

  // Interactive timeline state
  const [currentMinute, setCurrentMinute] = useState(16000); // Default to Outage Period 1
  const [windowSize, setWindowSize] = useState(500);
  const [showAnomalies, setShowAnomalies] = useState(true);
  const [showScore, setShowScore] = useState(true);

  // Live prediction state
  const [prediction, setPrediction] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);

  const predictDebounceRef = useRef(null);

  // 1. Initial health check and model info
  const checkHealth = useCallback(async () => {
    setIsCheckingApi(true);
    const health = await checkApiHealth();
    setApiStatus(health);
    if (health.online) {
      const info = await fetchModelInfo();
      setModelInfo(info);
    }
    setIsCheckingApi(false);
  }, []);

  // 2. Load dataset on initial mount
  useEffect(() => {
    async function init() {
      try {
        setIsLoadingData(true);
        const summary = await loadSummaryData();
        setData(summary);

        // Preload binary buffer in background for high performance
        loadFeaturesBuffer();

        // Check backend health
        checkHealth();
      } catch (err) {
        console.error('Failed to initialize dataset:', err);
        setDataError(err.message);
      } finally {
        setIsLoadingData(false);
      }
    }

    init();

    // Periodic health check every 20 seconds
    const interval = setInterval(checkHealth, 20000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // 3. Trigger /predict whenever currentMinute changes
  const runPrediction = useCallback(async (minute) => {
    if (!data) return;

    setIsPredicting(true);
    try {
      // 1. Get 128-metric vector for this minute
      const metrics = await getMetricVector(minute);
      
      // 2. Get precomputed score for fallback alignment
      const fallbackScore = data.metrics.scores[minute] ?? 0;
      const threshold = data.metadata.threshold ?? -0.05;

      // 3. Post to /predict
      const res = await postPredict(metrics, fallbackScore, threshold);
      setPrediction(res);
    } catch (err) {
      console.error('Prediction trigger error:', err);
    } finally {
      setIsPredicting(false);
    }
  }, [data]);

  // Debounced execution when scrubbing slider
  useEffect(() => {
    if (!data) return;

    if (predictDebounceRef.current) {
      clearTimeout(predictDebounceRef.current);
    }

    predictDebounceRef.current = setTimeout(() => {
      runPrediction(currentMinute);
    }, 90);

    return () => {
      if (predictDebounceRef.current) {
        clearTimeout(predictDebounceRef.current);
      }
    };
  }, [currentMinute, data, runPrediction]);

  // Next anomaly jumper
  const handleNextAnomaly = () => {
    if (!data || !data.metrics.labels) return;
    const labels = data.metrics.labels;
    for (let i = currentMinute + 1; i < labels.length; i++) {
      if (labels[i] === 1) {
        setCurrentMinute(i);
        return;
      }
    }
    // wrap around if none ahead
    for (let i = 0; i < currentMinute; i++) {
      if (labels[i] === 1) {
        setCurrentMinute(i);
        return;
      }
    }
  };

  // Previous anomaly jumper
  const handlePrevAnomaly = () => {
    if (!data || !data.metrics.labels) return;
    const labels = data.metrics.labels;
    for (let i = currentMinute - 1; i >= 0; i--) {
      if (labels[i] === 1) {
        setCurrentMinute(i);
        return;
      }
    }
    // wrap around to end
    for (let i = labels.length - 1; i > currentMinute; i--) {
      if (labels[i] === 1) {
        setCurrentMinute(i);
        return;
      }
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex flex-col items-center justify-center text-slate-300 gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <Server className="w-5 h-5 text-indigo-400 absolute inset-0 m-auto" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-white tracking-tight">Chargement du Système AIOps</h2>
          <p className="text-xs text-slate-400 mt-1">
            Chargement des 28 420 enregistrements multivariés du Server Machine Dataset (SMD)...
          </p>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex flex-col items-center justify-center text-slate-300 gap-4 p-6">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 max-w-md text-center">
          <AlertOctagon className="w-8 h-8 mx-auto mb-2 text-rose-400" />
          <h3 className="font-bold text-white text-base">Erreur de chargement des données</h3>
          <p className="text-xs text-rose-300 mt-1">{dataError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const trueLabel = data?.metrics?.labels?.[currentMinute] ?? 0;
  const threshold = data?.metadata?.threshold ?? -0.05;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col selection:bg-indigo-500/30">
      
      {/* Top Navigation Bar */}
      <Navbar 
        apiStatus={apiStatus} 
        modelInfo={modelInfo || {
          model: "Isolation Forest",
          threshold: threshold,
          n_features: 128
        }}
        onRefreshHealth={checkHealth}
        isCheckingApi={isCheckingApi}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        {/* Section 1: Global Model Performance KPIs */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Performances Globales du Modèle (Dataset Complet - 28 420 min)
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              Test Set • SMD machine-1-1
            </span>
          </div>
          <KpiCards kpis={data?.metadata?.kpis} />
        </section>

        {/* Section 2: Interactive Minute Controller & Live Prediction */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Slider & Navigation (7 cols) */}
          <div className="lg:col-span-7">
            <MinuteSelector 
              minute={currentMinute}
              totalMinutes={data?.metadata?.totalMinutes || 28420}
              windowSize={windowSize}
              setWindowSize={setWindowSize}
              onChangeMinute={setCurrentMinute}
              onNextAnomaly={handleNextAnomaly}
              onPrevAnomaly={handlePrevAnomaly}
              anomalyPeriods={data?.periods || []}
              showAnomalies={showAnomalies}
              setShowAnomalies={setShowAnomalies}
              showScore={showScore}
              setShowScore={setShowScore}
            />
          </div>

          {/* Live Inférence Card (5 cols) */}
          <div className="lg:col-span-5">
            <PredictionCard 
              prediction={prediction}
              isLoading={isPredicting}
              minute={currentMinute}
              trueLabel={trueLabel}
              threshold={threshold}
            />
          </div>

        </section>

        {/* Section 3: Time Series Multi-Metrics Chart */}
        <section>
          <TimeSeriesChart 
            metricsData={data?.metrics}
            minute={currentMinute}
            windowSize={windowSize}
            showAnomalies={showAnomalies}
          />
        </section>

        {/* Section 4: Isolation Forest Score Chart */}
        <section>
          <ScoreChart 
            metricsData={data?.metrics}
            minute={currentMinute}
            windowSize={windowSize}
            threshold={threshold}
          />
        </section>

        {/* Section 5: Statistics for the visible window */}
        <section>
          <WindowStats 
            metricsData={data?.metrics}
            minute={currentMinute}
            windowSize={windowSize}
            threshold={threshold}
          />
        </section>

        {/* Section 6: Anomaly History Audit Table */}
        <section>
          <AnomalyTable 
            periods={data?.periods || []}
            currentMinute={currentMinute}
            onSelectMinute={setCurrentMinute}
          />
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B0F17] py-6 px-4 lg:px-8 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Système de Prédiction de Dégradation de Performance • <strong className="text-slate-300">Amine El-Baydaouy</strong> (ENSAM Rabat - BunionTech)
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>FastAPI + Vite React + Tailwind CSS + Recharts</span>
            <span>•</span>
            <span>Server Machine Dataset (SMD)</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
