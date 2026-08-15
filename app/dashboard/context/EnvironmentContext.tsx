"use client";

import {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from "react";
import { fetchResolvedVarsAction } from "@/app/dashboard/environments/actions";
import { interpolate } from "@/lib/environments";

const STORAGE_KEY_ID   = "paperplane_active_env_id";
const STORAGE_KEY_NAME = "paperplane_active_env_name";

type EnvContextValue = {
  activeEnvId:   string | null;
  activeEnvName: string;
  /** Call this when the user switches the active environment. */
  setActiveEnv:  (id: string | null, name: string) => void;
  /** Resolved key→value map (only enabled variables). */
  variables:     Record<string, string>;
  /** Replace {{key}} tokens in a string using the active environment. */
  interpolate:   (str: string) => string;
  /** Force a re-fetch of variables (e.g. after editing). */
  refresh:       () => void;
};

const EnvironmentContext = createContext<EnvContextValue>({
  activeEnvId:   null,
  activeEnvName: "",
  setActiveEnv:  () => {},
  variables:     {},
  interpolate:   (s) => s,
  refresh:       () => {},
});

export function EnvironmentProvider({ children }: { children: React.ReactNode }) {
  const [activeEnvId,   setActiveEnvId]   = useState<string | null>(null);
  const [activeEnvName, setActiveEnvName] = useState("");
  const [variables,     setVariables]     = useState<Record<string, string>>({});
  const refreshCounter = useRef(0);

  // Rehydrate from localStorage after mount
  useEffect(() => {
    const id   = localStorage.getItem(STORAGE_KEY_ID);
    const name = localStorage.getItem(STORAGE_KEY_NAME) ?? "";
    if (id) { setActiveEnvId(id); setActiveEnvName(name); }
  }, []);

  // Re-fetch resolved variables whenever active env or refresh counter changes
  useEffect(() => {
    if (!activeEnvId) { setVariables({}); return; }
    fetchResolvedVarsAction(activeEnvId).then(setVariables);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEnvId, refreshCounter.current]);

  const setActiveEnv = useCallback((id: string | null, name: string) => {
    setActiveEnvId(id);
    setActiveEnvName(name);
    if (id) {
      localStorage.setItem(STORAGE_KEY_ID,   id);
      localStorage.setItem(STORAGE_KEY_NAME, name);
    } else {
      localStorage.removeItem(STORAGE_KEY_ID);
      localStorage.removeItem(STORAGE_KEY_NAME);
    }
  }, []);

  const refresh = useCallback(() => {
    refreshCounter.current += 1;
    if (!activeEnvId) return;
    fetchResolvedVarsAction(activeEnvId).then(setVariables);
  }, [activeEnvId]);

  const interpolateFn = useCallback(
    (str: string) => interpolate(str, variables),
    [variables],
  );

  return (
    <EnvironmentContext.Provider value={{
      activeEnvId,
      activeEnvName,
      setActiveEnv,
      variables,
      interpolate: interpolateFn,
      refresh,
    }}>
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  return useContext(EnvironmentContext);
}
