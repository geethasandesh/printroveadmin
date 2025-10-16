/**
 * Get the API base URL from environment variables
 * Falls back to localhost for development
 */
export const getApiUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
};

/**
 * Get the API base URL without the /api suffix
 * Falls back to localhost for development
 */
export const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001';
};
