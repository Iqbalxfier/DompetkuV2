// Di mode dev lokal (npm run dev), fallback ke http://localhost:5000/api
// Di mode production (Vercel), jika VITE_API_URL belum diset, biarkan kosong agar browser tidak memicu peringatan Private Network Access ke localhost
const API_BASE_URL = import.meta.env.VITE_API_URL 
  || (import.meta.env.DEV ? 'http://localhost:5000/api' : '');

export function isApiConfigured() {
  return Boolean(API_BASE_URL);
}

async function request(endpoint, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('API server belum dikonfigurasi. Menggunakan mode database lokal (IndexedDB).');
  }

  const token = localStorage.getItem('dompetku_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Terjadi kesalahan pada request API.');
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error.message);
    throw error;
  }
}

const api = {
  isConfigured: () => Boolean(API_BASE_URL),
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
