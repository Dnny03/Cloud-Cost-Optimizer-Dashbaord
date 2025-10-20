// Centralized client for calling the Flask backend API
// - Uses VITE_API_URL when set; otherwise falls back to "/api" (Vite dev proxy)
// - Attaches JWT if present, sends a timezone header, and normalizes errors

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api"; // base URL for all requests

// Read the persisted JWT token (if any)
function getToken() {
  return localStorage.getItem("token");
}

// Build Authorization header only when token exists
function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// Always send the client timezone (IANA string) so server can localize reporting
function tzHeader() {
  try {
    return { "X-Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" };
  } catch {
    return { "X-Timezone": "UTC" }; // fallback if browser APIs are restricted
  }
}

// Thin fetch wrapper that:
// - sets JSON headers
// - adds timezone + auth headers
// - handles 401 by clearing token and redirecting (unless allow401 is set)
// - throws readable error messages for non-OK responses
async function request(path, { method = "GET", headers = {}, body, allow401 = false } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...tzHeader(),       // send timezone info
      ...authHeaders(),    // send JWT if available
      ...headers,
    },
    body,
  });

  // Try to parse JSON; fall back to text on non-JSON responses
  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await res.json().catch(() => ({}))
    : await res.text().catch(() => "");

  // Unauthorized → optionally auto-logout + redirect to /login
  if (res.status === 401) {
    if (!allow401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (location.pathname !== "/login") location.href = "/login";
    }
    const msg = typeof payload === "string" ? payload : payload?.error || "Unauthorized";
    throw new Error(msg);
  }

  // Any other error → throw a friendly message
  if (!res.ok) {
    const msg =
      typeof payload === "string"
        ? payload || `HTTP ${res.status}`
        : payload?.error || payload?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return payload; // success path
}

class CloudAPI {
  // ---------- AUTH ----------
  async login(username, password) {
    // allow401 so the login form can show server-provided error text without redirect
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      allow401: true,
    });
    if (data?.token) localStorage.setItem("token", data.token);   // persist JWT
    if (data?.user)  localStorage.setItem("user", JSON.stringify(data.user)); // persist user info
    return data;
  }

  async register(username, password, email) {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password, email }),
      allow401: true,
    });
  }

  async forgotPassword({ username, email }) {
    return request("/auth/forgot", {
      method: "POST",
      body: JSON.stringify({ username, email }),
      allow401: true,
    });
  }

  async resetPassword(token, new_password) {
    return request("/auth/reset", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
      allow401: true,
    });
  }

  // Stateless JWT: clearing local storage is sufficient to “log out”
  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  // ---------- HEALTH ----------
  checkHealth() {
    return request("/health"); // simple liveness endpoint
  }

  // ---------- SUMMARY / PROVIDERS ----------
  getProviders() {
    return request("/providers"); // e.g., ["aws","gcp","azure"]
  }

  getCostsSummary() {
    return request("/costs/summary"); // combined totals across providers
  }

  // ---------- PROVIDER DETAILS ----------
  getMTDCosts(provider) {
    return request(`/${provider}/costs/mtd`); // month-to-date breakdown
  }

  getDailyCosts(provider, days = 30) {
    return request(`/${provider}/costs/daily?days=${days}`); // daily series for charts
  }

  getLiveMetrics(provider) {
    return request(`/${provider}/metrics/live`); // current CPU/memory/etc
  }

  getTimeseries(provider, type = "cpu", minutes = 30) {
    return request(`/${provider}/metrics/timeseries?type=${type}&minutes=${minutes}`); // timeseries for charts
  }
}

const api = new CloudAPI();
export default api;
export const getCostsSummary = () => api.getCostsSummary(); // convenience export