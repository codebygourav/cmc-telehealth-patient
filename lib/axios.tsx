import axios, { InternalAxiosRequestConfig } from "axios";
import { getAuthToken } from "./authToken";
import { getActiveProfileId } from "./activeProfile";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(
  /\/+$/,
  "",
);

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config.baseURL && !(config.url || "").startsWith("http")) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not configured in the running app. Restart or rebuild the frontend after updating frontend/patient/.env.",
    );
  }

  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;

    // Viewing a family member's profile: the API scopes patient data to them.
    const activeProfileId = getActiveProfileId();
    if (activeProfileId) {
      config.headers["X-Patient-Profile"] = activeProfileId;
    }
  }

  // Testing / DevTools override: allow simulating country via URL (?country=US) or localStorage
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const country =
      urlParams.get("country_iso") ||
      urlParams.get("country") ||
      localStorage.getItem("test_country_iso");
    if (country) {
      const code = country.trim().toUpperCase();
      config.headers["X-Country-ISO"] = code;
      config.headers["X-Country-Code"] = code;
      config.params = {
        ...config.params,
        country_iso: code,
      };
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = String(error?.config?.url || "");
    const isAuthRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/forgot-password");

    if (
      typeof window !== "undefined" &&
      error?.response?.status === 401 &&
      !isAuthRequest
    ) {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }

    return Promise.reject(error);
  },
);

export default api;
