import { useCallback, useEffect, useMemo, useState } from "react";

import { apiRequest } from "../lib/api";
import { AuthContext } from "./auth-context.js";

const TOKEN_KEY = "municipal.token";

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
    if (!token) return;

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

  const register = useCallback(
    async (values) => {
      const payload = await apiRequest("/api/auth/register", {
        method: "POST",
        body: values
      });

      acceptSession(payload.data);

      return payload.data.user;
    },
    [acceptSession]
  );

  const value = useMemo(
    () => ({ token, user, status, signIn, signOut, bootstrap, register }),
    [token, user, status, signIn, signOut, bootstrap, register]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
