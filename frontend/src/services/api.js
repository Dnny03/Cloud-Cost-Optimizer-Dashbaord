const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class CloudAPI {
  async checkHealth() {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  }

  async getProviders() {
    const response = await fetch(`${API_BASE_URL}/providers`);
    return response.json();
  }

  async getMTDCosts(provider) {
    const response = await fetch(`${API_BASE_URL}/${provider}/costs/mtd`);
    return response.json();
  }

  async getDailyCosts(provider, days = 30) {
    const response = await fetch(
      `${API_BASE_URL}/${provider}/costs/daily?days=${days}`
    );
    return response.json();
  }

  async getLiveMetrics(provider) {
    const response = await fetch(`${API_BASE_URL}/${provider}/metrics/live`);
    return response.json();
  }

  async getCostsSummary() {
    const response = await fetch(`${API_BASE_URL}/costs/summary`);
    return response.json();
  }
}

export default new CloudAPI();
export const getCostsSummary = () => new CloudAPI().getCostsSummary();