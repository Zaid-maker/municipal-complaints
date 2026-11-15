import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { apiRequest } from "../lib/api";

const TOKEN_KEY = "municipal.token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(token ? "restoring" : "anonymous");

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  const acceptSession = useCallback((session) => {
    localStorage.setItem(TOKEN_KEY, session.token);
    setUser(session.user);
    setToken(session.token);
    setStatus("authenticated");
  }, []);

  useEffect(() => {
    if (!token) {
      setStatus("anonymous");
      return;
    }

    let cancelled = false;

    apiRequest("/api/auth/me", { token })
      .then((payload) => {
        if (cancelled) return;

        setUser(payload.data.user);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!cancelled) signOut();
      });

    return () => {
      cancelled = true;
    };
  }, [token, signOut]);

  const signIn = useCallback(
    async (email, password) => {
      const payload = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email, password }
      });

      acceptSession(payload.data);

      return payload.data.user;
    },
    [acceptSession]
  );

  const bootstrap = useCallback(
    async (values) => {
      const payload = await apiRequest("/api/auth/bootstrap-admin", {
        method: "POST",
        body: values
      });

      acceptSession(payload.data);

      return payload.data.user;
    },
    [acceptSession]
  );

  const value = useMemo(
    () => ({ token, user, status, signIn, signOut, bootstrap }),
    [token, user, status, signIn, signOut, bootstrap]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
