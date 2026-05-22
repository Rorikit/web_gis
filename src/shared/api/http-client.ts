import axios from 'axios';
import { env } from '@/shared/config/env';

export const httpClient = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && window.location.pathname !== '/auth') {
      window.location.assign('/auth');
    }
    if (status === 403 && window.location.pathname !== '/access-denied') {
      window.location.assign('/access-denied');
    }
    return Promise.reject(error);
  },
);
