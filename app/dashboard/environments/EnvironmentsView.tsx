"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { Code2, Plus, Trash2, Check, Loader2, X, Zap, ZapOff, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Environment, EnvVariable } from "@/lib/environments";
import {
  createEnvironmentAction, updateEnvironmentAction, deleteEnvironmentAction,
  fetchVariablesAction, upsertVariableAction, deleteVariableAction,
} from "./actions";
import { useEnvironment } from "@/app/dashboard/context/EnvironmentContext";

// ─── Inline editable label ───────────────────────────────────────────────────
function InlineEdit({ value, onSave, className }: { value: string; onSave: (v: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  function commit() {
    setEditing(false);
    const t = draft.trim();
    if (t && t !== value) onSave(t); else setDraft(value);
  }
  if (editing) return (
    <input ref={ref} value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setEditing(false); setDraft(value); } }}
      className={cn("bg-transparent outline-none border-b border-orange-400 w-full", className)}
    />
  );
  return <span className={cn("cursor-text", className)} onDoubleClick={() => setEditing(true)}>{value}</span>;
}

// ─── Variable row ─────────────────────────────────────────────────────────────
function VarRow({
  variable, onSave, onDelete,
}: {
  variable: EnvVariable;
  onSave: (patch: Partial<EnvVariable>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="group grid grid-cols-[2rem_1fr_1fr_2rem] items-center border-b text-xs last:border-0 hover:bg-muted/20 transition">
      {/* Enable toggle */}
      <button
        onClick={() => onSave({ enabled: !variable.enabled })}
        className="flex items-center justify-center py-2"
      >
        <span className={cn("text-[10px]", variable.enabled ? "text-orange-500" : "text-muted-foreground/30")}>●</span>
      </button>
      {/* Key */}
      <input
        defaultValue={variable.key}
        onBlur={e => { if (e.target.value.trim() !== variable.key) onSave({ key: e.target.value.trim() }); }}
        placeholder="VARIABLE_NAME"
        className="bg-transparent px-2 py-2 font-mono outline-none focus:bg-orange-50 dark:focus:bg-orange-950/20 transition"
      />
      {/* Value */}
      <input
        defaultValue={variable.value}
        onBlur={e => { if (e.target.value !== variable.value) onSave({ value: e.target.value }); }}
        placeholder="value"
        className="bg-transparent px-2 py-2 font-mono outline-none focus:bg-orange-50 dark:focus:bg-orange-950/20 transition border-l"
      />
      {/* Delete */}
      <button
        onClick={onDelete}
        className="flex items-center justify-center py-2 text-transparent group-hover:text-muted-foreground hover:text-destructive! transition"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

// ─── New environment dialog ───────────────────────────────────────────────────
function NewEnvDialog({ onCreated }: { onCreated: (e: Environment) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPending, start] = useTransition();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) setTimeout(() => ref.current?.focus(), 50); }, [open]);
  function submit() {
    if (!name.trim()) return;
    start(async () => {
      const env = await createEnvironmentAction(name);
      if (env) { onCreated(env); setOpen(false); setName(""); }
    });
  }
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <Plus className="size-3.5" /> New environment
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-xl border bg-background p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">New Environment</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
            </div>
            <input ref={ref} value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="e.g. Production" className="w-full rounded-md border bg-muted/30 px-3 py-2 text-sm outline-none transition focus:border-orange-400 mb-3" />
            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 rounded-md border px-3 py-2 text-xs hover:bg-muted transition">Cancel</button>
              <button onClick={submit} disabled={!name.trim() || isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-orange-500 px-3 py-2 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition">
                {isPending && <Loader2 className="size-3 animate-spin" />} Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main view ───────────────────────────────────────────────────────────────
export function EnvironmentsView({ initialEnvironments }: { initialEnvironments: Environment[] }) {
  const { activeEnvId, activeEnvName, setActiveEnv, refresh } = useEnvironment();
  const [environments, setEnvironments] = useState<Environment[]>(initialEnvironments);
  const [selectedId, setSelectedId] = useState<string | null>(initialEnvironments[0]?.id ?? null);
  const [variables, setVariables] = useState<EnvVariable[]>([]);
  const [loadingVars, setLoadingVars] = useState(false);
  const [isPending, start] = useTransition();

  useEffect(() => {
    if (!selectedId) { setVariables([]); return; }
    setLoadingVars(true);
    fetchVariablesAction(selectedId).then(v => { setVariables(v); setLoadingVars(false); });
  }, [selectedId]);

  const selectedEnv = environments.find(e => e.id === selectedId);

  function handleCreated(env: Environment) {
    setEnvironments(prev => [...prev, env].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedId(env.id);
  }

  function handleRename(id: string, name: string) {
    setEnvironments(prev => prev.map(e => e.id === id ? { ...e, name } : e));
    start(() => updateEnvironmentAction(id, name));
    if (activeEnvId === id) setActiveEnv(id, name);
  }

  function handleDelete(id: string) {
    const next = environments.filter(e => e.id !== id);
    setEnvironments(next);
    if (selectedId === id) setSelectedId(next[0]?.id ?? null);
    if (activeEnvId === id) setActiveEnv(null, "");
    start(() => deleteEnvironmentAction(id));
  }

  function handleSetActive(env: Environment) {
    if (activeEnvId === env.id) {
      setActiveEnv(null, ""); // deactivate
    } else {
      setActiveEnv(env.id, env.name);
    }
  }

  async function handleAddVariable() {
    if (!selectedId) return;
    const v = await upsertVariableAction({ environmentId: selectedId, key: "", value: "", enabled: true });
    if (v) setVariables(prev => [...prev, v]);
  }

  async function handleSaveVar(id: string, patch: Partial<EnvVariable>) {
    const existing = variables.find(v => v.id === id);
    if (!existing) return;
    const updated = { ...existing, ...patch };
    setVariables(prev => prev.map(v => v.id === id ? updated : v));
    await upsertVariableAction({ id, environmentId: updated.environmentId, key: updated.key, value: updated.value, enabled: updated.enabled });
    if (activeEnvId === selectedId) refresh();
  }

  async function handleDeleteVar(id: string) {
    setVariables(prev => prev.filter(v => v.id !== id));
    await deleteVariableAction(id);
    if (activeEnvId === selectedId) refresh();
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Left: Environments list ── */}
      <div className="flex w-56 shrink-0 flex-col border-r">
        <div className="flex items-center justify-between border-b px-3 py-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Environments</span>
          {isPending && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
        </div>

        <div className="flex-1 overflow-auto py-1">
          {environments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center text-muted-foreground">
              <Code2 className="size-8 opacity-40" />
              <p className="text-xs">No environments yet</p>
            </div>
          ) : (
            environments.map(env => (
              <div
                key={env.id}
                onClick={() => setSelectedId(env.id)}
                className={cn(
                  "group flex cursor-pointer items-center gap-2 px-3 py-2 text-xs transition",
                  selectedId === env.id
                    ? "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
                    : "hover:bg-muted/50 text-foreground",
                )}
              >
                {/* Active indicator */}
                <span className={cn("size-1.5 shrink-0 rounded-full", activeEnvId === env.id ? "bg-orange-500" : "bg-muted-foreground/20")} />
                <span className="flex-1 truncate font-medium">{env.name}</span>
                {activeEnvId === env.id && (
                  <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-bold bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">ACTIVE</span>
                )}
              </div>
            ))
          )}
        </div>

        <div className="border-t px-2 py-2">
          <NewEnvDialog onCreated={handleCreated} />
        </div>
      </div>

      {/* ── Right: Variables panel ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {!selectedEnv ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted"><Code2 className="size-7" /></div>
            <p className="text-sm font-medium">Select an environment</p>
            <p className="text-xs">or create one to get started</p>
          </div>
        ) : (
          <>
            {/* Panel header */}
            <div className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
              <Code2 className="size-4 text-orange-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <InlineEdit
                  value={selectedEnv.name}
                  onSave={name => handleRename(selectedEnv.id, name)}
                  className="text-sm font-semibold"
                />
                <p className="text-xs text-muted-foreground mt-0.5">Double-click name to rename</p>
              </div>
              {/* Activate / Deactivate */}
              <button
                onClick={() => handleSetActive(selectedEnv)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition border",
                  activeEnvId === selectedEnv.id
                    ? "border-orange-400 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/30 dark:text-orange-400"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {activeEnvId === selectedEnv.id
                  ? <><Zap className="size-3.5" /> Active</>
                  : <><ZapOff className="size-3.5" /> Set Active</>
                }
              </button>
              {/* Delete environment */}
              <button
                onClick={() => handleDelete(selectedEnv.id)}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                title="Delete environment"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>

            {/* Active env banner */}
            {activeEnvId === selectedEnv.id && (
              <div className="flex shrink-0 items-center gap-2 border-b bg-orange-50 px-4 py-2 text-xs text-orange-700 dark:bg-orange-950/20 dark:text-orange-400">
                <Zap className="size-3.5" />
                This environment is active — its variables will be interpolated in all requests using <code className="font-mono font-bold">{"{{"} key {"}}"}</code> syntax.
              </div>
            )}

            {/* Variable table */}
            <div className="flex-1 overflow-auto">
              {/* Table header */}
              <div className="grid grid-cols-[2rem_1fr_1fr_2rem] border-b bg-muted/30 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <div className="px-2 py-2" />
                <div className="px-2 py-2">Variable</div>
                <div className="px-2 py-2 border-l">Value</div>
                <div />
              </div>

              {loadingVars ? (
                <div className="flex h-24 items-center justify-center text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              ) : (
                <>
                  {variables.map(v => (
                    <VarRow
                      key={v.id}
                      variable={v}
                      onSave={patch => handleSaveVar(v.id, patch)}
                      onDelete={() => handleDeleteVar(v.id)}
                    />
                  ))}
                  <button
                    onClick={handleAddVariable}
                    className="flex w-full items-center gap-1.5 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition"
                  >
                    <Plus className="size-3" /> Add variable
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
