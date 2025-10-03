// src/services/api.ts
import axios, { AxiosRequestConfig, AxiosError, AxiosHeaders } from 'axios';
import {
  getToken,
  getRefreshToken,
  saveToken,
  saveRefreshToken,
  removeToken,
  removeRefreshToken,
} from '../utils/storage';
import { Platform } from 'react-native';

// === Base URL seçimi ===
// Debug (emulator) => backend: http://10.0.2.2:7116/api
// Release (prod)   => backend: https://api.faleyna.online/api
// const BASE_URL =
//   __DEV__ && Platform.OS === 'android'
//     ? 'http://10.0.2.2:7116/api'
//     : 'https://api.faleyna.online/api';
const BASE_URL =  'https://api.faleyna.online/api';

// Axios örneği
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// 🔓 Token eklenmeyecek endpoint'ler (path kısmı)
const EXCLUDED_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

// Genişletilmiş konfigürasyon tipi (custom `_retry` flag'i için)
interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// Küçük yardımcı: Authorization set et
function setAuthHeader(headers: any, token: string) {
  // Axios v1'de headers, AxiosHeaders olabilir
  if (headers && typeof (headers as AxiosHeaders).set === 'function') {
    (headers as AxiosHeaders).set('Authorization', `Bearer ${token}`);
  } else if (headers) {
    headers['Authorization'] = `Bearer ${token}`;
  }
}

// ✅ Request interceptor
api.interceptors.request.use(async (config) => {
  const path = config.url || '';
  const shouldSkip = EXCLUDED_ENDPOINTS.some((endpoint) => path.endsWith(endpoint));

  if (!shouldSkip) {
    const token = await getToken();
    if (token) setAuthHeader(config.headers, token);
  }

  return config;
});

// 🔁 Refresh mekanizması
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // 401 aldıysak ve daha önce retry yapılmadıysa
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Yenileme sürerken bekleyen istekleri kuyruğa al
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          setAuthHeader(originalRequest.headers, token);
          return api(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        // Not: baseURL otomatik eklenecek; sadece path veriyoruz
        const res = await api.post('/auth/refresh', { refreshToken });

        const newAccessToken: string = (res.data as any).accessToken;
        const newRefreshToken: string = (res.data as any).refreshToken;

        await saveToken(newAccessToken);
        await saveRefreshToken(newRefreshToken);

        processQueue(null, newAccessToken);

        setAuthHeader(originalRequest.headers, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await removeToken();
        await removeRefreshToken();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
