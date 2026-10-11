import axios from "axios";

// All requests go to /api (Vite forwards them to the backend during development).
const api = axios.create({ baseURL: "/api" });

// Attach the login token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turn server errors into readable messages
export const errorMessage = (err) =>
  err?.response?.data?.message || (err?.request ? "Cannot reach the server. Is the backend running?" : err?.message || "Something went wrong");

export default api;
