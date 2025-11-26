// Centralized client for calling the Flask backend API
// - Uses VITE_API_URL when set; otherwise falls back to "/api" (Vite dev proxy)
// - Attaches JWT if present, sends a timezone header, and normalizes errors

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api"; // base URL for all requests

// Safe localStorage wrapper
const storage = {
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.error(`Failed to get ${key} from localStorage:`, error);
            return null;
        }
    },

    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error(`Failed to set ${key} in localStorage:`, error);
            return false;
        }
    },

    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Failed to remove ${key} from localStorage:`, error);
            return false;
        }
    }
};

// Read the persisted JWT token (if any)
function getToken() {
    return storage.getItem("token");
}

// Build Authorization header only when token exists
function authHeaders() {
    const t = getToken();
    return t ? {Authorization: `Bearer ${t}`} : {};
}

// Always send the client timezone (IANA string) so server can localize reporting
function tzHeader() {
    try {
        return {"X-Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"};
    } catch {
        return {"X-Timezone": "UTC"}; // fallback if browser APIs are restricted
    }
}

// Thin fetch wrapper that:
// - sets JSON headers
// - adds timezone + auth headers
// - handles 401 by clearing token and redirecting (unless allow401 is set)
// - throws readable error messages for non-OK responses
async function request(path, {method = "GET", headers = {}, body, allow401 = false, signal} = {}) {
    try {
        const res = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                ...tzHeader(),       // send timezone info
                ...authHeaders(),    // send JWT if available
                ...headers,
            },
            body,
            signal, // Support request cancellation
        });

        // Try to parse JSON; fall back to text on non-JSON responses
        const contentType = res.headers.get("content-type") || "";
        const payload = contentType.includes("application/json")
            ? await res.json().catch(() => ({}))
            : await res.text().catch(() => "");

        // Unauthorized → optionally auto-logout + redirect to /login
        if (res.status === 401) {
            if (!allow401) {
                storage.removeItem("token");
                storage.removeItem("user");
                if (typeof window !== 'undefined' && window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
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
    } catch (error) {
        // Check if error is due to abort
        if (error.name === 'AbortError') {
            throw new Error('Request was cancelled');
        }
        throw error;
    }
}

class CloudAPI {
    // ---------- AUTH ----------
    async login(username, password) {
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        // allow401 so the login form can show server-provided error text without redirect
        const data = await request("/auth/login", {
            method: "POST",
            body: JSON.stringify({username, password}),
            allow401: true,
        });

        if (data?.token) {
            storage.setItem("token", data.token);   // persist JWT
        }
        if (data?.user) {
            storage.setItem("user", JSON.stringify(data.user)); // persist user info
        }

        return data;
    }

    async register(username, password, email, role = "viewer") {
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        return request("/auth/register", {
            method: "POST",
            body: JSON.stringify({username, password, email, role}),
            allow401: true,
        });
    }

    async forgotPassword({username, email}) {
        if (!username && !email) {
            throw new Error('Username or email is required');
        }

        return request("/auth/forgot", {
            method: "POST",
            body: JSON.stringify({username, email}),
            allow401: true,
        });
    }

    async resetPassword(token, new_password) {
        if (!token || !new_password) {
            throw new Error('Token and new password are required');
        }

        return request("/auth/reset", {
            method: "POST",
            body: JSON.stringify({token, new_password}),
            allow401: true,
        });
    }

    // Stateless JWT: clearing local storage is sufficient to "log out"
    logout() {
        storage.removeItem("token");
        storage.removeItem("user");
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
        if (!provider) {
            throw new Error('Provider is required');
        }
        return request(`/${provider}/costs/mtd`); // month-to-date breakdown
    }

    getDailyCosts(provider, days = 30) {
        if (!provider) {
            throw new Error('Provider is required');
        }
        return request(`/${provider}/costs/daily?days=${days}`); // daily series for charts
    }

    getLiveMetrics(provider) {
        if (!provider) {
            throw new Error('Provider is required');
        }
        return request(`/${provider}/metrics/live`); // current CPU/memory/etc
    }

    getTimeseries(provider, type = "cpu", minutes = 30) {
        if (!provider) {
            throw new Error('Provider is required');
        }
        return request(`/${provider}/metrics/timeseries?type=${type}&minutes=${minutes}`); // timeseries for charts
    }

    // ---------- ANOMALY DETECTION ----------
    getAnomalies(provider) {
        if (!provider) {
            throw new Error('Provider is required');
        }
        return request(`/${provider}/anomalies`); // detected cost anomalies
    }

    getAllAnomalies() {
        return request("/anomalies/all"); // anomalies across all providers
    }

    // ---------- FORECASTING ----------
    getForecast(provider, days = 7) {
        if (!provider) {
            throw new Error('Provider is required');
        }
        return request(`/${provider}/forecast?days=${days}`); // cost forecast
    }

    getAllForecasts(days = 7) {
        return request(`/forecast/all?days=${days}`); // forecasts for all providers
    }

    // ---------- RECOMMENDATIONS ----------
    getRecommendations(provider) {
        if (!provider) {
            throw new Error('Provider is required');
        }
        return request(`/${provider}/recommendations`); // cost optimization recommendations
    }

    getAllRecommendations() {
        return request("/recommendations/all"); // recommendations across all providers
    }

    // ---------- ALERTS ----------
    getAlerts(provider) {
        if (!provider) {
            throw new Error('Provider is required');
        }
        return request(`/${provider}/alerts`); // active alerts for provider
    }

    getAllAlerts() {
        return request("/alerts/all"); // alerts across all providers
    }

    // ---------- BUDGETS ----------
    getBudgets(provider) {
        if (!provider) {
            throw new Error('Provider is required');
        }
        return request(`/${provider}/budgets`); // budget tracking for provider
    }

    getAllBudgets() {
        return request("/budgets/all"); // budgets across all providers
    }

    // ---------- SERVICES BREAKDOWN ----------
    getServicesBreakdown(provider) {
        if (!provider) {
            throw new Error('Provider is required');
        }
        return request(`/${provider}/services/breakdown`); // services by category
    }

    getAllServicesBreakdown() {
        return request("/services/breakdown/all"); // breakdown for all providers
    }
}

const api = new CloudAPI();
export default api;
export const getCostsSummary = () => api.getCostsSummary(); // convenience export