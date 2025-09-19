// API service for communicating with the EcoSwap backend
const API_BASE_URL = import.meta.env.PROD 
  ? '/api'  // Azure Static Web Apps automatically routes /api to functions
  : import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Analyze recipe from URL
  async analyzeRecipe(url) {
    return this.request('/recipes/analyze', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  // Validate recipe URL
  async validateUrl(url) {
    const params = new URLSearchParams({ url });
    return this.request(`/recipes/validate-url?${params}`);
  }

  // Get supported sites
  async getSupportedSites() {
    return this.request('/recipes/supported-sites');
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export default new ApiService();
