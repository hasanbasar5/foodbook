"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { InternalAxiosRequestConfig } from "axios";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { queuePendingToast } from "@/context/ToastContext";
import { AuthResponse, AuthUser, Role } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  ownerLogin: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    fullName?: string;
    accountType?: "user" | "business";
    organizationName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: Role[]) => boolean;
  updateProfile: (fullName: string, avatarUrl?: string | null) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "foodbook.auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const refreshPromise = useRef<Promise<string | null> | null>(null);
  const accessTokenRef = useRef<string | null>(null);

  const navigateToHome = (nextUser: AuthUser | null) => {
    const target = nextUser?.isOwner ? "/owner" : "/dashboard";

    if (typeof window !== "undefined") {
      window.location.href = target;
      return;
    }

    router.push(target);
  };

  const persistSession = (data: AuthResponse | null) => {
    if (!data) {
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
      setAccessToken(null);
      accessTokenRef.current = null;
      delete api.defaults.headers.common.Authorization;
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setUser(data.user);
    setAccessToken(data.accessToken);
    accessTokenRef.current = data.accessToken;
    api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
  };

  const refreshSession = async () => {
    if (refreshPromise.current) {
      return refreshPromise.current;
    }

    refreshPromise.current = api
      .post<AuthResponse>("/auth/refresh")
      .then(({ data }) => {
        persistSession(data);
        return data.accessToken;
      })
      .catch(() => {
        persistSession(null);
        return null;
      })
      .finally(() => {
        refreshPromise.current = null;
      });

    return refreshPromise.current;
  };

  const refreshCurrentUser = async () => {
    if (!accessToken) {
      return;
    }
    const { data } = await api.get<AuthUser>("/auth/me");
    setUser(data);
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as AuthResponse;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...parsed,
          user: data,
        })
      );
    }
  };

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) {
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(cached) as AuthResponse;
      setUser(parsed.user);
      setAccessToken(parsed.accessToken);
      accessTokenRef.current = parsed.accessToken;
      api.defaults.headers.common.Authorization = `Bearer ${parsed.accessToken}`;
      refreshSession().finally(() => setLoading(false));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    accessTokenRef.current = accessToken;
    if (accessToken) {
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [accessToken]);

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      if (accessTokenRef.current) {
        config.headers.Authorization = `Bearer ${accessTokenRef.current}`;
      }
      return config;
    });

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config as (InternalAxiosRequestConfig & {
          _retry?: boolean;
        });
        const requestUrl = originalRequest?.url || "";
        const isAuthRequest =
          requestUrl.includes("/auth/login") ||
          requestUrl.includes("/auth/register") ||
          requestUrl.includes("/auth/refresh");

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !isAuthRequest
        ) {
          originalRequest._retry = true;
          const token = await refreshSession();
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }
          router.push("/login");
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [router]);

  const authenticate = async (
    endpoint: "/auth/login" | "/auth/register",
    input: {
      email: string;
      password: string;
      fullName?: string;
      accountType?: "user" | "business";
      organizationName?: string;
    },
    options?: {
      requireOwner?: boolean;
    }
  ) => {
    const { data } = await api.post<AuthResponse>(endpoint, {
      email: input.email,
      password: input.password,
      ...(input.fullName ? { fullName: input.fullName } : {}),
      ...(endpoint === "/auth/register"
        ? {
            accountType: input.accountType || "user",
            ...(input.organizationName ? { organizationName: input.organizationName } : {}),
          }
        : {}),
    });
    if (options?.requireOwner && !data.user.isOwner) {
      persistSession(null);
      throw new Error("Only owner user id 3 can access the owner dashboard.");
    }
    persistSession(data);
    queuePendingToast(
      endpoint === "/auth/login"
        ? {
            tone: "success",
            title: "Login successful",
            description: `Welcome back, ${data.user.fullName || data.user.email}.`,
          }
        : {
            tone: "success",
            title: "Account created",
            description: "Your Food Book account is ready.",
          }
    );
    navigateToHome(data.user);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      loading,
      login: (email, password) =>
        authenticate("/auth/login", {
          email,
          password,
        }),
      ownerLogin: (email, password) =>
        authenticate(
          "/auth/login",
          {
            email,
            password,
          },
          { requireOwner: true }
        ),
      register: (input) => authenticate("/auth/register", input),
      logout: async () => {
        try {
          await api.post("/auth/logout");
        } finally {
          queuePendingToast({
            tone: "info",
            title: "Logged out",
            description: "You have been signed out successfully.",
          });
          persistSession(null);
          if (typeof window !== "undefined") {
            window.location.href = "/login";
            return;
          }
          router.push("/login");
        }
      },
      hasRole: (roles) => Boolean(user && roles.includes(user.role)),
      updateProfile: async (fullName, avatarUrl) => {
        const { data } = await api.put<AuthUser>("/auth/profile", {
          fullName,
          avatarUrl: avatarUrl || null,
        });
        persistSession({
          accessToken: accessToken || "",
          user: data,
        });
      },
      changePassword: async (currentPassword, newPassword, confirmPassword) => {
        await api.put("/auth/password", {
          currentPassword,
          newPassword,
          confirmPassword,
        });
        persistSession(null);
        queuePendingToast({
          tone: "success",
          title: "Password updated",
          description: "Sign in again with your new password.",
        });
        if (typeof window !== "undefined") {
          window.location.href = "/login";
          return;
        }
        router.push("/login");
      },
      refreshCurrentUser,
    }),
    [accessToken, loading, router, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
