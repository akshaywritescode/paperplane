"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { HttpMethod, ParamRow, HeaderRow, AuthConfig } from "../components/RequestEditor";
import type { BodyConfig } from "../components/RequestEditor/body";
import { DEFAULT_BODY } from "../components/RequestEditor/body";

export type RepeaterTab = {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  params: ParamRow[];
  headers: HeaderRow[];
  body: BodyConfig;
  auth: AuthConfig;
};

type RepeaterContextType = {
  tabs: RepeaterTab[];
  addTab: (tab: Omit<RepeaterTab, "id">) => void;
  removeTab: (id: string) => void;
  updateTab: (id: string, patch: Partial<RepeaterTab>) => void;
};

const RepeaterContext = createContext<RepeaterContextType | null>(null);

export function RepeaterProvider({ children }: { children: React.ReactNode }) {
  const [tabs, setTabs] = useState<RepeaterTab[]>([]);

  const addTab = useCallback((tab: Omit<RepeaterTab, "id">) => {
    const id = crypto.randomUUID();
    setTabs((prev) => [...prev, { ...tab, id }]);
  }, []);

  const removeTab = useCallback((id: string) => {
    setTabs((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTab = useCallback((id: string, patch: Partial<RepeaterTab>) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  }, []);

  return (
    <RepeaterContext.Provider value={{ tabs, addTab, removeTab, updateTab }}>
      {children}
    </RepeaterContext.Provider>
  );
}

export function useRepeater() {
  const ctx = useContext(RepeaterContext);
  if (!ctx) throw new Error("useRepeater must be used within RepeaterProvider");
  return ctx;
}
