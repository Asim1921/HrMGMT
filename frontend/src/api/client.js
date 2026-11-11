import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

// create a new axios instance with the base URL and headers
export const api = axios.create({
  baseURL: `${baseURL}/v1`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// add the access token to the headers of the request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// handle the response of the request
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refreshToken');
      if (refresh) {
        try {
          const { data } = await axios.post(`${baseURL}/v1/auth/refresh-token`, { refreshToken: refresh });
          localStorage.setItem('accessToken', data.accessToken);
          if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch (_e) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.dispatchEvent(new Event('auth:logout'));
        }
      }
    }
    return Promise.reject(err);
  }
);
