import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchCurrentUser, loginUser, registerUser } from "../api/auth";
import {
  bindAuthHandlers,
  clearStoredTokens,
  getStoredTokens,
  setAccessToken,
  setRefreshToken,
} from "../api/client";

export const AuthContext = createContext(null);

function normalizeBackendError(error) {
  const data = error?.response?.data;

  if (!data) {
    return "Une erreur reseau est survenue.";
  }

  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (typeof data === "string") {
    return data;
  }

  const entries = Object.entries(data)
    .map(([field, value]) => {
      if (Array.isArray(value)) {
        return `${field}: ${value.join(" ")}`;
      }
      if (typeof value === "string") {
        return `${field}: ${value}`;
      }
      return null;
    })
    .filter(Boolean);

  return entries[0] || "Une erreur inattendue est survenue.";
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function logout() {
    clearStoredTokens();
    setUser(null);
    setError("");
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    bindAuthHandlers({
      getRefreshToken: () => getStoredTokens().refresh,
      onAuthFailure: logout,
    });
  }, [logout]);

  useEffect(() => {
    async function bootstrapAuth() {
      const { access, refresh } = getStoredTokens();

      if (!access || !refresh) {
        setIsBootstrapping(false);
        return;
      }

      setAccessToken(access);

      try {
        const profile = await fetchCurrentUser();
        setUser(profile.user);
      } catch (bootstrapError) {
        clearStoredTokens();
        setUser(null);
      } finally {
        setIsBootstrapping(false);
      }
    }

    bootstrapAuth();
  }, []);

  async function loadCurrentUser() {
    const profile = await fetchCurrentUser();
    setUser(profile.user);
    return profile.user;
  }

  async function login(credentials) {
    setIsLoading(true);
    setError("");

    try {
      const data = await loginUser(credentials);
      setAccessToken(data.access);
      setRefreshToken(data.refresh);
      setUser(data.user);
      return data;
    } catch (loginError) {
      console.error("LOGIN ERROR:", loginError);
      console.error("LOGIN RESPONSE:", loginError?.response?.data);

      const message =
        loginError?.response?.data?.detail ||
        loginError?.response?.data?.non_field_errors?.[0] ||
        loginError?.message ||
        normalizeBackendError(loginError);

      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function register(payload) {
    setIsLoading(true);
    setError("");

    try {
      const data = await registerUser(payload);
      return data;
    } catch (registerError) {
      const message = normalizeBackendError(registerError);
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }

  const value = {
    user,
    error,
    isLoading,
    isBootstrapping,
    isAuthenticated: Boolean(user),
    login,
    logout,
    register,
    loadCurrentUser,
    clearError: () => setError(""),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
