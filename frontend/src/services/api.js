/**
 * Terranex Telemetry & Model API Service
 * Connects to FastAPI backend (local or production Render endpoint)
 */

export const API_BASE = (import.meta.env.VITE_API_URL || "https://terranex-backend.onrender.com").replace(/\/$/, "");

// Centralized fetch with error handling and fallback
async function fetchJson(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`Terranex API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // System Health & Telemetry
  getHealth: () => fetchJson("/health"),
  getMLStatus: () => fetchJson("/ml/status"),
  getLiveRainfall: () => fetchJson("/live/rainfall"),
  getLiveVillages: () => fetchJson("/live/villages"),

  // Network Topology & Staging Depots
  getNetwork: () => fetchJson("/network"),
  getDepots: () => fetchJson("/depots"),

  // 24-Hour Predictive Early Warning Timeline
  getTimeline: (hours = 24, threshold = 0.5) =>
    fetchJson(`/risk/timeline?hours=${hours}&threshold=${threshold}`),

  // Single Segment Explainability Diagnostic
  getSegmentRisk: (segmentId, { rainfall = 0, prior1 = 10, prior2 = 5, threshold = 0.5 } = {}) =>
    fetchJson(
      `/risk/segment/${segmentId}?rainfall_mm=${rainfall}&prior1=${prior1}&prior2=${prior2}&threshold=${threshold}`
    ),

  // Full Network Simulation Risk
  getSimulationRisk: ({ rainfall = 85, prior1 = 10, prior2 = 5, threshold = 0.5 } = {}) =>
    fetchJson(
      `/risk/simulation?rainfall_mm=${rainfall}&prior1=${prior1}&prior2=${prior2}&threshold=${threshold}`
    ),

  // Dynamic Multi-Depot Dispatch & Evacuation Plan
  getDispatchPlan: ({ mode = "live", hour = 0, rainfall = 85, prior1 = 10, prior2 = 5, threshold = 0.5 } = {}) => {
    if (mode === "live") {
      return fetchJson(`/dispatch/plan?mode=live&hour=${hour}&threshold=${threshold}`);
    }
    return fetchJson(
      `/dispatch/plan?mode=simulation&rainfall_mm=${rainfall}&prior1=${prior1}&prior2=${prior2}&threshold=${threshold}`
    );
  },

  // Direct ML Inference
  predictML: (params) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/ml/predict?${query}`);
  },

  // Safe Dijkstra Route
  getSafeRoute: (source, target = null, rainfall = 0) => {
    let url = `/route/safe?source=${source}&rainfall_mm=${rainfall}`;
    if (target) url += `&target=${target}`;
    return fetchJson(url);
  },
};
