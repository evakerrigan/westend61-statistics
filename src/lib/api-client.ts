import axios, { type AxiosInstance } from 'axios';
import { env } from '@/config/env';

let bearerToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  bearerToken = token;
};

export const getAuthToken = (): string | null => bearerToken;

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.API_URL,
});

apiClient.interceptors.request.use((config) => {
  if (bearerToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${bearerToken}`;
  }
  return config;
});
