import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  // On page load, restore the session from the saved token
  useEffect(() => {
    if (!localStorage.getItem("token")) return setLoading(false);
    api.get("/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  // Open a live (Socket.IO) connection while logged in
  useEffect(() => {
    if (!user?._id) return;
   const s = io(
  import.meta.env.VITE_API_URL || undefined,
  { auth: { token: localStorage.getItem("token") } }
);
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user?._id]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (form) => {
    const { data } = await api.post("/auth/register", form);
    if (data.token) {
      localStorage.setItem("token", data.token);
      setUser(data.user);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    const { data } = await api.get("/auth/me");
    setUser(data.user);
    return data.user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, socket, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Run `handler` whenever the server pushes `event` (e.g. "rankings:updated")
export function useSocketEvent(event, handler) {
  const { socket } = useAuth();
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!socket) return;
    const fn = (data) => ref.current(data);
    socket.on(event, fn);
    return () => socket.off(event, fn);
  }, [socket, event]);
}
