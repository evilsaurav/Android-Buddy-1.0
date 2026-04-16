import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearStoredToken,
  getStoredToken,
  loginWithBackend,
  setAuthFailureHandler,
  signupWithBackend,
  fetchProfile,
} from '../lib/api';

type SessionMode = 'guest' | 'authenticated' | null;

interface AuthProfile {
  username?: string;
  display_name?: string;
  email?: string;
  semester?: string;
  [key: string]: unknown;
}

interface AuthContextValue {
  loading: boolean;
  sessionMode: SessionMode;
  token: string | null;
  profile: AuthProfile | null;
  continueAsGuest: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  signup: (payload: { username: string; password: string; semester?: string; email?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const SESSION_MODE_KEY = '@bcabuddy_session_mode';
const TOKEN_ISSUED_AT_KEY = '@bcabuddy_token_issued_at';
const ACCESS_TOKEN_EXPIRE_MS = 24 * 60 * 60 * 1000;
const EARLY_LOGOUT_BUFFER_MS = 15 * 60 * 1000;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [sessionMode, setSessionMode] = useState<SessionMode>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [issuedAtMs, setIssuedAtMs] = useState<number | null>(null);

  const forceSessionReset = async () => {
    await clearStoredToken();
    await Promise.all([
      AsyncStorage.removeItem(SESSION_MODE_KEY),
      AsyncStorage.removeItem(TOKEN_ISSUED_AT_KEY),
    ]);
    setToken(null);
    setProfile(null);
    setIssuedAtMs(null);
    setSessionMode(null);
  };

  const refreshProfile = async () => {
    if (!token) {
      setProfile(null);
      return;
    }

    try {
      const data = await fetchProfile(token);
      setProfile(data);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    setAuthFailureHandler(() => {
      forceSessionReset();
    });

    const bootstrap = async () => {
      try {
        const [storedMode, storedToken, storedIssuedAt] = await Promise.all([
          AsyncStorage.getItem(SESSION_MODE_KEY),
          getStoredToken(),
          AsyncStorage.getItem(TOKEN_ISSUED_AT_KEY),
        ]);

        if (storedToken) {
          const parsedIssuedAt = Number(storedIssuedAt || 0);
          const safeIssuedAt = Number.isFinite(parsedIssuedAt) && parsedIssuedAt > 0 ? parsedIssuedAt : Date.now();
          const age = Date.now() - safeIssuedAt;

          if (age >= ACCESS_TOKEN_EXPIRE_MS - EARLY_LOGOUT_BUFFER_MS) {
            await forceSessionReset();
            return;
          }

          setToken(storedToken);
          setIssuedAtMs(safeIssuedAt);
          setSessionMode('authenticated');
          await Promise.all([
            AsyncStorage.setItem(SESSION_MODE_KEY, 'authenticated'),
            AsyncStorage.setItem(TOKEN_ISSUED_AT_KEY, String(safeIssuedAt)),
          ]);
          try {
            const me = await fetchProfile(storedToken);
            setProfile(me);
          } catch {
            setProfile(null);
          }
        } else if (storedMode === 'guest') {
          setSessionMode('guest');
        }
      } finally {
        setLoading(false);
      }
    };

    bootstrap();

    return () => {
      setAuthFailureHandler(null);
    };
  }, []);

  useEffect(() => {
    if (!token || !issuedAtMs) return;

    const interval = setInterval(() => {
      const age = Date.now() - issuedAtMs;
      if (age >= ACCESS_TOKEN_EXPIRE_MS - EARLY_LOGOUT_BUFFER_MS) {
        forceSessionReset();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [token, issuedAtMs]);

  const continueAsGuest = async () => {
    await clearStoredToken();
    await Promise.all([
      AsyncStorage.setItem(SESSION_MODE_KEY, 'guest'),
      AsyncStorage.removeItem(TOKEN_ISSUED_AT_KEY),
    ]);
    setToken(null);
    setProfile(null);
    setIssuedAtMs(null);
    setSessionMode('guest');
  };

  const login = async (username: string, password: string) => {
    const result = await loginWithBackend(username, password);
    const now = Date.now();
    setToken(result.access_token);
    setIssuedAtMs(now);
    setSessionMode('authenticated');
    await Promise.all([
      AsyncStorage.setItem(SESSION_MODE_KEY, 'authenticated'),
      AsyncStorage.setItem(TOKEN_ISSUED_AT_KEY, String(now)),
    ]);
    try {
      const me = await fetchProfile(result.access_token);
      setProfile(me);
    } catch {
      setProfile({ username });
    }
  };

  const signup = async (payload: { username: string; password: string; semester?: string; email?: string }) => {
    await signupWithBackend(payload);
    await login(payload.username, payload.password);
  };

  const logout = async () => {
    await clearStoredToken();
    await Promise.all([
      AsyncStorage.removeItem(SESSION_MODE_KEY),
      AsyncStorage.removeItem(TOKEN_ISSUED_AT_KEY),
    ]);
    setToken(null);
    setProfile(null);
    setIssuedAtMs(null);
    setSessionMode(null);
  };

  const value = useMemo(
    () => ({
      loading,
      sessionMode,
      token,
      profile,
      continueAsGuest,
      login,
      signup,
      logout,
      refreshProfile,
    }),
    [loading, sessionMode, token, profile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
