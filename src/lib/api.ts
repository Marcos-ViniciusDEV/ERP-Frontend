import axios from "axios";

export const API_BASE_URL = "http://localhost:3000";
const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const CHECKOUT_COMPANY_TOKEN_KEY = "checkout_company_token";
const CHECKOUT_COMPANY_KEY = "checkout_company";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptor to attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const checkoutCompanyToken = localStorage.getItem(CHECKOUT_COMPANY_TOKEN_KEY);
  const requestUrl = String(config.url || "");
  const authorizationToken = (requestUrl.includes("/checkout") ? checkoutCompanyToken : null) || token;
  if (authorizationToken) {
    config.headers.Authorization = `Bearer ${authorizationToken}`;
  }
  return config;
});

let refreshRequest: Promise<string | null> | null = null;

export function setSessionTokens(token: string | null, refreshToken?: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  else if (refreshToken === null) localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export type CheckoutCompany = {
  id: number;
  razaoSocial: string;
  nomeFantasia?: string | null;
  cnpj: string;
  telefone?: string | null;
};

export function setCheckoutCompanySession(token: string | null, empresa?: CheckoutCompany | null) {
  if (token) localStorage.setItem(CHECKOUT_COMPANY_TOKEN_KEY, token);
  else localStorage.removeItem(CHECKOUT_COMPANY_TOKEN_KEY);
  if (empresa) localStorage.setItem(CHECKOUT_COMPANY_KEY, JSON.stringify(empresa));
  else if (empresa === null) localStorage.removeItem(CHECKOUT_COMPANY_KEY);
}

export function getCheckoutCompanySession() {
  const token = localStorage.getItem(CHECKOUT_COMPANY_TOKEN_KEY);
  const storedCompany = localStorage.getItem(CHECKOUT_COMPANY_KEY);
  if (!token || !storedCompany) return null;
  try {
    return { token, empresa: JSON.parse(storedCompany) as CheckoutCompany };
  } catch {
    setCheckoutCompanySession(null, null);
    return null;
  }
}

export async function refreshSessionToken() {
  if (refreshRequest) return refreshRequest;
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  refreshRequest = axios
    .post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken })
    .then(({ data }) => {
      setSessionTokens(data.token, data.refreshToken);
      return data.token as string;
    })
    .catch(() => {
      setSessionTokens(null, null);
      return null;
    })
    .finally(() => {
      refreshRequest = null;
    });
  return refreshRequest;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 403 && error.response?.data?.code === "EMPRESA_BLOQUEADA") {
      localStorage.setItem("empresa_bloqueada_motivo", error.response.data.motivo ?? "");
      window.location.href = "/bloqueado";
      return Promise.reject(error);
    }

    const originalRequest = error.config as any;
    const requestUrl = String(originalRequest?.url || "");
    const isPublicAuthRequest = [
      "/auth/login",
      "/auth/refresh",
      "/auth/validate-company",
      "/auth/checkout-company",
    ].some((path) => requestUrl.includes(path));

    if (error.response?.status === 401 && requestUrl.includes("/checkout") && getCheckoutCompanySession()) {
      setCheckoutCompanySession(null, null);
      window.location.href = `/login?redirect=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`;
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest?._retry && !isPublicAuthRequest) {
      originalRequest._retry = true;
      const token = await refreshSessionToken();
      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }
      setSessionTokens(null, null);
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
