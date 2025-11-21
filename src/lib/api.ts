import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptor to attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  console.log("[API Interceptor] Token from localStorage:", token ? `${token.substring(0, 20)}...` : "NO TOKEN");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("[API Interceptor] Authorization header set");
  } else {
    console.log("[API Interceptor] No token found, skipping auth header");
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (e.g., redirect to login)
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
