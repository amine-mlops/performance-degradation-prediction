/**
 * API Service for communicating with the FastAPI backend
 * and loading preprocessed static datasets.
 */

// We support both the Vite proxy (/api) and direct connection to FastAPI (http://localhost:8000)
const API_BASE = '/api';
const DIRECT_API_BASE = 'http://localhost:8000';

let cachedFeaturesBuffer = null;
let sampleFeaturesMap = null;

/**
 * Check if the FastAPI backend is reachable and healthy
 */
export async function checkApiHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    // Try through proxy first, then direct
    let response;
    try {
      response = await fetch(`${API_BASE}/health`, { signal: controller.signal });
    } catch {
      response = await fetch(`${DIRECT_API_BASE}/health`, { credentials: 'omit' });
    }

    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      return { online: true, data };
    }
    return { online: false, error: `HTTP ${response.status}` };
  } catch (err) {
    return { online: false, error: err.message || 'Connection refused' };
  }
}

/**
 * Fetch model information from /info
 */
export async function fetchModelInfo() {
  try {
    let res = await fetch(`${API_BASE}/info`);
    if (!res.ok) {
      res = await fetch(`${DIRECT_API_BASE}/info`);
    }
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Return standard fallback model info
  }
  return {
    model: "Isolation Forest",
    threshold: -0.05,
    n_features: 128,
    description: "Détection d'anomalies sur métriques système (SMD)"
  };
}

/**
 * Load static summary data containing the 4 key metrics, IF scores, labels, and anomaly periods
 */
export async function loadSummaryData() {
  const res = await fetch('/data/summary_data.json');
  if (!res.ok) {
    throw new Error(`Failed to load summary dataset: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Load sample features fallback dictionary
 */
export async function loadSampleFeatures() {
  if (sampleFeaturesMap) return sampleFeaturesMap;
  try {
    const res = await fetch('/data/sample_features.json');
    if (res.ok) {
      sampleFeaturesMap = await res.json();
      return sampleFeaturesMap;
    }
  } catch (err) {
    console.warn('Could not load sample features JSON:', err);
  }
  return {};
}

/**
 * Pre-cache binary float32 array in the background for instant 0ms access
 */
export async function loadFeaturesBuffer() {
  if (cachedFeaturesBuffer) return cachedFeaturesBuffer;
  try {
    const res = await fetch('/data/features_float32.bin');
    if (res.ok) {
      cachedFeaturesBuffer = await res.arrayBuffer();
      return cachedFeaturesBuffer;
    }
  } catch (err) {
    console.warn('Binary features file background load note:', err);
  }
  return null;
}

/**
 * Retrieve the 128-metric float vector for a given minute (0 to 28419)
 */
export async function getMetricVector(minute) {
  // 1. Try from cached binary buffer if already loaded in memory
  if (cachedFeaturesBuffer) {
    const byteOffset = minute * 128 * 4;
    if (byteOffset + 128 * 4 <= cachedFeaturesBuffer.byteLength) {
      return Array.from(new Float32Array(cachedFeaturesBuffer, byteOffset, 128));
    }
  }

  // 2. Try fetching from FastAPI /features/{minute}
  try {
    let res = await fetch(`${API_BASE}/features/${minute}`);
    if (!res.ok) {
      res = await fetch(`${DIRECT_API_BASE}/features/${minute}`);
    }
    if (res.ok) {
      const json = await res.json();
      return json.metrics;
    }
  } catch (e) {
    // fallback below
  }

  // 3. Try from sample_features.json
  const samples = await loadSampleFeatures();
  if (samples && samples[minute.toString()]) {
    return samples[minute.toString()];
  }

  // 4. Generate a synthetic 128-dim fallback array with baseline properties
  return Array(128).fill(0).map((_, i) => Math.sin(minute * 0.01 + i) * 0.1);
}

/**
 * Trigger POST request to /predict with the 128 metrics
 */
export async function postPredict(metrics, fallbackScore = null, threshold = -0.05) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    let res;
    try {
      res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics }),
        signal: controller.signal
      });
    } catch {
      res = await fetch(`${DIRECT_API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics })
      });
    }

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        ...data,
        source: 'api'
      };
    }
  } catch (err) {
    console.warn('API /predict failed, using synchronized model score fallback:', err);
  }

  // Fallback if API server is stopped: use the precomputed decision score and threshold
  const score = fallbackScore !== null ? Number(fallbackScore) : 0.0;
  const pred = score < threshold ? 1 : 0;
  return {
    prediction: pred,
    score: Math.round(score * 1000000) / 1000000,
    status: pred === 1 ? 'anomalie' : 'normal',
    message: pred === 1 
      ? 'Dégradation détectée — intervention recommandée.'
      : 'Système en fonctionnement normal.',
    source: 'local_sync'
  };
}
