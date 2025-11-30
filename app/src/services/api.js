import { BACKEND_URL } from "./config.js";

async function request(path, options = {}) {
  if (!BACKEND_URL) {
    throw new Error("BACKEND_URL is not set in app.json");
  }

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers: headers 
  };

  const response = await fetch(`${BACKEND_URL}${path}`, config);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

export const Api = {
  // MODIFIKASI: Menerima parameter page dan limit
  getSensorReadings(page = 1, limit = 10) {
    return request(`/api/readings?page=${page}&limit=${limit}`);
  },
  getThresholds() {
    return request("/api/thresholds");
  },
  createThreshold(payload, token) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return request("/api/thresholds", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });
  },
  clearSensorReadings() {
    return request("/api/readings", {
      method: "DELETE",
    });
  },
};