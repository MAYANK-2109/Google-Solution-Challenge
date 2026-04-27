const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Dynamic API URL detection:
// If running on localhost, use the local backend.
// Otherwise, use the production backend URL from environment variables.
export const API_URL = isLocal 
  ? 'http://localhost:5000/api' 
  : (import.meta.env.VITE_API_URL || 'https://google-solution-challenge-backend-uzkp.onrender.com/api');

export const SOCKET_URL = isLocal 
  ? 'http://localhost:5000' 
  : (import.meta.env.VITE_SOCKET_URL || 'https://google-solution-challenge-backend-uzkp.onrender.com');

export const PROJECT_NAME = 'SAHELI';
