import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FRENZY_STORAGE_KEY = '@bcabuddy_frenzy_theme';

export interface FrenzyPayload {
  themeOverride?: string | null;
  frenzyActive?: boolean;
  frenzyPersona?: string;
  frenzyMessage?: string;
  frenzySpeedMs?: number;
  frenzyResetLabel?: string;
}

interface FrenzyState {
  active: boolean;
  theme: string | null;
  persona: string | null;
  message: string | null;
  speedMs: number | null;
  resetLabel: string;
}

interface FrenzyContextValue extends FrenzyState {
  applyFrenzy: (payload: FrenzyPayload) => Promise<void>;
  clearFrenzy: () => Promise<void>;
}

const FrenzyContext = createContext<FrenzyContextValue | undefined>(undefined);

const EMPTY_STATE: FrenzyState = {
  active: false,
  theme: null,
  persona: null,
  message: null,
  speedMs: null,
  resetLabel: 'Exit',
};

export function FrenzyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FrenzyState>(EMPTY_STATE);

  useEffect(() => {
    const loadStored = async () => {
      try {
        const stored = await AsyncStorage.getItem(FRENZY_STORAGE_KEY);
        if (!stored) return;
        const parsed = JSON.parse(stored) as Record<string, unknown>;
        setState({
          active: Boolean(parsed.active ?? true),
          theme: typeof parsed.theme === 'string' ? parsed.theme : null,
          persona: typeof parsed.persona === 'string' ? parsed.persona : null,
          message: typeof parsed.message === 'string' ? parsed.message : null,
          speedMs: typeof parsed.speedMs === 'number' ? parsed.speedMs : null,
          resetLabel: typeof parsed.resetLabel === 'string' ? parsed.resetLabel : 'Exit',
        });
      } catch {}
    };

    loadStored();
  }, []);

  const clearFrenzy = useCallback(async () => {
    setState(EMPTY_STATE);
    try {
      await AsyncStorage.removeItem(FRENZY_STORAGE_KEY);
    } catch {}
  }, []);

  const applyFrenzy = useCallback(async (payload: FrenzyPayload) => {
    if (payload.themeOverride === null) {
      await clearFrenzy();
      return;
    }

    const nextState: FrenzyState = {
      active: Boolean(payload.frenzyActive ?? true),
      theme: typeof payload.themeOverride === 'string' ? payload.themeOverride : state.theme,
      persona: typeof payload.frenzyPersona === 'string' ? payload.frenzyPersona : state.persona,
      message: typeof payload.frenzyMessage === 'string' ? payload.frenzyMessage : state.message,
      speedMs: typeof payload.frenzySpeedMs === 'number' ? payload.frenzySpeedMs : state.speedMs,
      resetLabel: typeof payload.frenzyResetLabel === 'string' ? payload.frenzyResetLabel : state.resetLabel,
    };

    if (nextState.active || nextState.theme || nextState.message || nextState.persona) {
      setState(nextState);
      try {
        await AsyncStorage.setItem(
          FRENZY_STORAGE_KEY,
          JSON.stringify({
            active: nextState.active,
            theme: nextState.theme,
            persona: nextState.persona,
            message: nextState.message,
            speedMs: nextState.speedMs,
            resetLabel: nextState.resetLabel,
          })
        );
      } catch {}
    }
  }, [clearFrenzy, state.message, state.persona, state.resetLabel, state.speedMs, state.theme]);

  const value = useMemo(() => ({
    ...state,
    applyFrenzy,
    clearFrenzy,
  }), [applyFrenzy, clearFrenzy, state]);

  return <FrenzyContext.Provider value={value}>{children}</FrenzyContext.Provider>;
}

export function useFrenzy() {
  const ctx = useContext(FrenzyContext);
  if (!ctx) {
    throw new Error('useFrenzy must be used within FrenzyProvider');
  }
  return ctx;
}
