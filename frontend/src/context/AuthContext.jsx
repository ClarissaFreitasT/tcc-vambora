import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../data/api";
import { AuthContext } from "./AuthContext";

const TOKEN_KEY = "vambora_token";
const USER_KEY = "vambora_usuario";

function readStoredUser() {
  if (!localStorage.getItem(TOKEN_KEY)) return null;
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(() =>
    Boolean(localStorage.getItem(TOKEN_KEY)),
  );

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setLoading(false);
  }, []);

  const restoreSession = useCallback(
    async (expectedToken = localStorage.getItem(TOKEN_KEY)) => {
      if (!expectedToken) return;

      try {
        const profile = await apiFetch("/usuarios/me");
        if (localStorage.getItem(TOKEN_KEY) !== expectedToken) return;
        localStorage.setItem(USER_KEY, JSON.stringify(profile));
        setUser(profile);
      } catch (error) {
        // Only an explicit 401 proves the token is invalid. A server/network
        // failure must not sign the user out or discard a valid cached profile.
        if (localStorage.getItem(TOKEN_KEY) !== expectedToken) return;
        if (error.status === 401) {
          clearSession();
        } else {
          setUser(readStoredUser());
        }
      } finally {
        if (localStorage.getItem(TOKEN_KEY) === expectedToken)
          setLoading(false);
      }
    },
    [clearSession],
  );

  useEffect(() => {
    const startupToken = localStorage.getItem(TOKEN_KEY);
    if (startupToken) {
      queueMicrotask(() => restoreSession(startupToken));
    }

    function handleUnauthorized(event) {
      const failedToken = event.detail?.token;
      const currentToken = localStorage.getItem(TOKEN_KEY);
      if (!failedToken || !currentToken || currentToken === failedToken)
        clearSession();
    }

    function handleStorage(event) {
      if (event.key === TOKEN_KEY) {
        const nextToken = localStorage.getItem(TOKEN_KEY);
        if (!nextToken) {
          setUser(null);
          setLoading(false);
        } else {
          setUser(readStoredUser());
          setLoading(true);
          restoreSession(nextToken);
        }
      } else if (event.key === USER_KEY) {
        setUser(readStoredUser());
      }
    }

    window.addEventListener("vambora:unauthorized", handleUnauthorized);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("vambora:unauthorized", handleUnauthorized);
      window.removeEventListener("storage", handleStorage);
    };
  }, [clearSession, restoreSession]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (!data?.token || !data?.usuario) {
        throw new Error("A resposta de login está incompleta.");
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.usuario));
      setUser(data.usuario);
      return data.usuario;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => clearSession(), [clearSession]);

  const updateUser = useCallback(async (changes) => {
    const data = await apiFetch("/usuarios/me", {
      method: "PATCH",
      body: JSON.stringify(changes),
    });
    const updatedUser = data.usuario;
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(localStorage.getItem(TOKEN_KEY)),
      login,
      logout,
      updateUser,
    }),
    [user, loading, login, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
