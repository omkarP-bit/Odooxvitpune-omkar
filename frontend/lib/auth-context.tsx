"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, User, setToken, clearToken } from "@/lib/api";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  isNew: boolean;
  setUser: (u: User) => void;
  login: (token: string) => Promise<User>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    api.getMe()
      .then((u) => { setUser(u); setIsNew(!u.companyName); })
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = async (token: string) => {
    setToken(token);
    const me = await api.getMe();
    setUser(me);
    setIsNew(!me.companyName);
    return me;
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setIsNew(false);
  };

  return <Ctx.Provider value={{ user, loading, isNew, setUser, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
