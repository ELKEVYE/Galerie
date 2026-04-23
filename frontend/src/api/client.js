import axios from "axios";


const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}/api`;

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

let accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
let refreshTokenRequest = null;
let authHandlers = {
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  onAuthFailure: () => {},
};

export const publicClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export function setAccessToken(token) {
  accessToken = token;
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

export function setRefreshToken(token) {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function getStoredTokens() {
  return {
    access: localStorage.getItem(ACCESS_TOKEN_KEY),
    refresh: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

export function clearStoredTokens() {
  accessToken = null;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function bindAuthHandlers(handlers) {
  authHandlers = {
    ...authHandlers,
    ...handlers,
  };
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response || originalRequest?._retry) {
      return Promise.reject(error);
    }

    if (error.response.status !== 401) {
      return Promise.reject(error);
    }

    const storedRefreshToken = authHandlers.getRefreshToken();
    if (!storedRefreshToken) {
      authHandlers.onAuthFailure();
      return Promise.reject(error);
    }

    try {
      originalRequest._retry = true;

      if (!refreshTokenRequest) {
        refreshTokenRequest = publicClient
          .post("/token/refresh/", { refresh: storedRefreshToken })
          .then((response) => {
            const newAccessToken = response.data.access;
            setAccessToken(newAccessToken);
            return newAccessToken;
          })
          .catch((refreshError) => {
            authHandlers.onAuthFailure();
            throw refreshError;
          })
          .finally(() => {
            refreshTokenRequest = null;
          });
      }

      const newAccessToken = await refreshTokenRequest;
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);
