"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import Cookies from "js-cookie";
import { api } from "@/lib/api";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "kasir";
  createdAt?: string;
  updatedAt?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    setIsLoading(true);
    const storedToken = Cookies.get("token") || (typeof window !== "undefined" ? localStorage.getItem("token") : null);

    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get("/api/users/current", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (response.data?.success && response.data?.data) {
        setUser(response.data.data);
        setToken(storedToken);
      } else {
        throw new Error("Invalid session");
      }
    } catch {
      Cookies.remove("token");
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async ({ email, password }: LoginCredentials) => {
    try {
      const response = await api.post("/api/users/login", { email, password });
      if (response.data?.success && response.data?.data?.token) {
        const receivedToken = response.data.data.token;
        const loggedUser = response.data.data.user;

        Cookies.set("token", receivedToken, { expires: 7 });
        if (typeof window !== "undefined") {
          localStorage.setItem("token", receivedToken);
          localStorage.setItem("user", JSON.stringify(loggedUser));
        }

        setToken(receivedToken);
        setUser(loggedUser);
        return { success: true, message: response.data.message || "Login berhasil" };
      }
      return { success: false, message: response.data?.message || "Login gagal" };
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        (error.response?.status === 401
          ? "Email atau password salah"
          : "Gagal terhubung ke server backend");
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.delete("/api/users/logout").catch(() => {});
      }
    } finally {
      Cookies.remove("token");
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
