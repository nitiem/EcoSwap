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
      console.log(`🔗 Making API request to: ${url}`);
      const response = await fetch(url, config);
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        // Try to get error details from response
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            // If it's not JSON, get the text content (likely HTML error page)
            const errorText = await response.text();
            console.error('❌ Non-JSON error response:', errorText.substring(0, 200) + '...');
            errorMessage = `Server returned HTML error page (${response.status})`;
          }
        } catch (parseError) {
          console.error('❌ Error parsing error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      // Parse successful response as JSON
      const data = await response.json();
      console.log('✅ API request successful');
      return data;
      
    } catch (error) {
      console.error('❌ API request failed:', error);
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
