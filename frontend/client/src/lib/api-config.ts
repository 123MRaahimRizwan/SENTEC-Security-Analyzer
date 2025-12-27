// API Configuration
// Change this if your backend is running on a different URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

// Helper function to build API URLs
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  // Ensure API_BASE_URL doesn't end with slash
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${baseUrl}/${cleanEndpoint}`;
}

