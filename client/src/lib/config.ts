// API Configuration for different environments
const isDevelopment = import.meta.env.DEV;

// Get API base URL from environment variables
const getApiBaseUrl = (): string => {
  // Always check for custom API URL first (works in both dev and production)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Fallback: in production, use the same domain
  if (!isDevelopment) {
    return window.location.origin;
  }
  
  // Default for local development (relative URLs)
  return "";
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to create full API URLs
export const createApiUrl = (path: string): string => {
  // If path already has a protocol, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // If no base URL configured, return the path as-is (relative URL)
  if (!API_BASE_URL) {
    return path;
  }
  
  // Combine base URL with path
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${apiPath}`;
};

// Log the configuration in development
if (isDevelopment) {
  console.log('API Configuration:', {
    baseUrl: API_BASE_URL,
    env: import.meta.env.VITE_API_BASE_URL,
    isDev: isDevelopment
  });
}
