import axios, { type InternalAxiosRequestConfig } from 'axios';

let accessToken: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      throw error;
    }

    const original = error.config as RetryConfig;
    const status = error.response?.status;
    const url = original.url ?? '';
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/signup') ||
      url.includes('/auth/refresh');

    if (status !== 401 || original._retry || isAuthRoute) {
      throw error;
    }

    original._retry = true;
    const nextToken = await refreshAccessToken();
    if (!nextToken) {
      throw error;
    }

    original.headers.Authorization = `Bearer ${nextToken}`;
    return api(original);
  },
);

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = api
      .post<{ accessToken: string }>('/auth/refresh')
      .then((response) => {
        accessToken = response.data.accessToken;
        return accessToken;
      })
      .catch(() => {
        accessToken = null;
        return null;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}
