"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { authService } from "@/services/authService";
import {
  SESSION_EXPIRED_EVENT,
  SESSION_STORAGE_KEY,
  clearAuthSession,
  getAuthSession,
  isSessionExpired,
  setAuthSession,
} from "@/lib/session";
import { decodeJwtPayload } from "@/lib/jwt";
import type {
  AuthResponse,
  AuthSession,
  AuthUser,
  LoginRequest,
  RegisterRequest,
  Role,
} from "@/types/auth";

interface AuthContextValue {
  /** Authenticated user, or null when signed out. */
  user: AuthUser | null;
  /** True while the persisted session is being restored. */
  restoring: boolean;
  /**
   * Starts the one-time session restore. Called by the navbar once it has
   * hydrated (it renders the `restoring` markup in the prerendered HTML, so
   * restoring earlier would make React see server HTML vs client markup and
   * log a hydration error on every page). Idempotent.
   */
  completeRestore: () => void;
  /** Signs in and persists the session. Throws on API errors. */
  signIn: (request: LoginRequest) => Promise<void>;
  /** Registers, persists the issued session and signs the user in. */
  register: (request: RegisterRequest) => Promise<void>;
  /** Clears the session and signs the user out. */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(response: AuthResponse): AuthUser {
  return {
    userId: response.userId,
    email: response.email,
    role: response.role as Role,
  };
}

function buildSession(response: AuthResponse): AuthSession {
  const payload = decodeJwtPayload(response.token);
  const expiresAt =
    payload?.exp !== undefined && typeof payload.exp === "number"
      ? payload.exp * 1000
      : null;

  return {
    token: response.token,
    user: toUser(response),
    expiresAt,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [restoring, setRestoring] = useState(true);
  const restoreStarted = useRef(false);

  const completeRestore = useCallback(() => {
    if (restoreStarted.current) {
      return;
    }
    restoreStarted.current = true;

    const session = getAuthSession();
    if (session) {
      if (isSessionExpired(session)) {
        clearAuthSession();
      } else {
        setUser(session.user);
      }
    }
    setRestoring(false);
  }, []);

  // Safety net: the navbar normally signals `completeRestore` as soon as it
  // hydrates. If that ever stops happening (layout change, hydration
  // failure), the timer still unlocks the session restore so the app can
  // never stay stuck on a skeleton forever.
  useEffect(() => {
    const timer = setTimeout(completeRestore, 5000);
    return () => clearTimeout(timer);
  }, [completeRestore]);

  // Keep the in-memory user in sync when the API client rejects a
  // token (401) or when the session changes in another tab.
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== SESSION_STORAGE_KEY) {
        return;
      }
      const session = getAuthSession();
      if (session && !isSessionExpired(session)) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const signIn = useCallback(async (request: LoginRequest) => {
    const response = await authService.login(request);
    const session = buildSession(response);
    setAuthSession(session);
    setUser(session.user);
  }, []);

  const register = useCallback(async (request: RegisterRequest) => {
    const response = await authService.register(request);
    const session = buildSession(response);
    setAuthSession(session);
    setUser(session.user);
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, restoring, completeRestore, signIn, register, logout }),
    [user, restoring, completeRestore, signIn, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Accesses the authenticated user and auth actions. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
