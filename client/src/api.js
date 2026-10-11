import axios from "axios";

// Use Render backend in production and Vite proxy during local development.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : "/api",
});

// Attach the login token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turn server errors into readable messages
export const errorMessage = (err) =>
  err?.response?.data?.message ||
  (err?.request
    ? "Cannot reach the server. Is the backend running?"
    : err?.message || "Something went wrong");

export default api;