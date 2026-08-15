"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen, FolderPlus, Trash2, RotateCw, Plus,
  MoreVertical, Pencil, ChevronRight, X, Check, Loader2,
  FileText, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Collection, SavedRequest } from "@/lib/collections";
import {
  createCollectionAction, updateCollectionAction, deleteCollectionAction,
  fetchSavedRequestsAction, deleteSavedRequestAction, updateSavedRequestAction,
} from "./actions";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const METHOD_COLORS: Record<string, string> = {
  GET:     "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/50",
  POST:    "text-amber-700   bg-amber-100   dark:text-amber-400   dark:bg-amber-950/50",
  PUT:     "text-blue-700    bg-blue-100    dark:text-blue-400    dark:bg-blue-950/50",
  PATCH:   "text-violet-700  bg-violet-100  dark:text-violet-400  dark:bg-violet-950/50",
  DELETE:  "text-red-700     bg-red-100     dark:text-red-400     dark:bg-red-950/50",
  HEAD:    "text-slate-600   bg-slate-100   dark:text-slate-400   dark:bg-slate-800/50",
  OPTIONS: "text-slate-600   bg-slate-100   dark:text-slate-400   dark:bg-slate-800/50",
};

// ─── Inline editable text ────────────────────────────────────────────────────
function InlineEdit({
  value, onSave, className,
}: { value: string; onSave: (v: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    else setDraft(value);
  }

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setEditing(false); setDraft(value); } }}
        className={cn("bg-transparent outline-none border-b border-orange-400 w-full", className)}
      />
    );
  }
  return (
    <span className={cn("cursor-text select-none", className)} onDoubleClick={() => setEditing(true)}>
      {value}
    </span>
  );
}

// ─── New Collection dialog ───────────────────────────────────────────────────
function NewCollectionDialog({ onCreated }: { onCreated: (c: Collection) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [isPending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);

  function submit() {
    if (!name.trim()) return;
    start(async () => {
      const col = await createCollectionAction(name, desc);
      if (col) { onCreated(col); setOpen(false); setName(""); setDesc(""); }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <FolderPlus className="size-3.5" />
        New collection
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border bg-background p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">New Collection</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
                <input
                  ref={inputRef}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  placeholder="My API Collection"
                  className="w-full rounded-md border bg-muted/30 px-3 py-2 text-sm outline-none transition focus:border-orange-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Description (optional)</label>
                <input
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="What's this collection for?"
                  className="w-full rounded-md border bg-muted/30 px-3 py-2 text-sm outline-none transition focus:border-orange-400"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-md border px-3 py-2 text-xs transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={!name.trim() || isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-orange-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-orange-600 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="size-3 animate-spin" />}
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main view ───────────────────────────────────────────────────────────────
export function CollectionsView({ initialCollections }: { initialCollections: Collection[] }) {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialCollections[0]?.id ?? null,
  );
  const [requests, setRequests] = useState<SavedRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [isPending, start] = useTransition();

  // Load requests when selection changes
  useEffect(() => {
    if (!selectedId) { setRequests([]); return; }
    setLoadingRequests(true);
    fetchSavedRequestsAction(selectedId).then(reqs => {
      setRequests(reqs);
      setLoadingRequests(false);
    });
  }, [selectedId]);

  const selectedCollection = collections.find(c => c.id === selectedId);

  function handleCollectionCreated(col: Collection) {
    setCollections(prev => [...prev, col].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedId(col.id);
  }

  function handleRenameCollection(id: string, name: string) {
    setCollections(prev => prev.map(c => c.id === id ? { ...c, name } : c));
    start(() => updateCollectionAction(id, name));
  }

  function handleDeleteCollection(id: string) {
    const next = collections.filter(c => c.id !== id);
    setCollections(next);
    if (selectedId === id) setSelectedId(next[0]?.id ?? null);
    start(() => deleteCollectionAction(id));
  }

  function handleDeleteRequest(id: string) {
    setRequests(prev => prev.filter(r => r.id !== id));
    start(() => deleteSavedRequestAction(id));
  }

  function handleRenameRequest(id: string, name: string) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, name } : r));
    start(() => updateSavedRequestAction(id, { name }));
  }

  /** Load a saved request into the editor */
  function handleOpenRequest(req: SavedRequest) {
    sessionStorage.setItem("paperplane_restore", JSON.stringify({
      title:   req.name,
      method:  req.method,
      url:     req.url,
      params:  req.params,
      headers: req.headers,
      body:    req.body,
      auth:    req.auth,
    }));
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Left: Collections sidebar ── */}
      <div className="flex w-56 shrink-0 flex-col border-r">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-3 py-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Collections
          </span>
          {isPending && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto py-1">
          {collections.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center text-muted-foreground">
              <FolderOpen className="size-8 opacity-40" />
              <p className="text-xs">No collections yet</p>
            </div>
          ) : (
            collections.map(col => (
              <div
                key={col.id}
                onClick={() => setSelectedId(col.id)}
                className={cn(
                  "group flex cursor-pointer items-center gap-2 px-3 py-2 text-xs transition",
                  selectedId === col.id
                    ? "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
                    : "hover:bg-muted/50 text-foreground",
                )}
              >
                <FolderOpen className="size-3.5 shrink-0" />
                <span className="flex-1 truncate font-medium">{col.name}</span>

                {/* Collection actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    onClick={e => e.stopPropagation()}
                    className="ml-auto opacity-0 group-hover:opacity-100 flex size-5 items-center justify-center rounded hover:bg-muted transition outline-none"
                  >
                    <MoreVertical className="size-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" className="w-40">
                    <DropdownMenuItem
                      className="flex items-center gap-2 text-xs"
                      onClick={e => { e.stopPropagation(); }}
                    >
                      <Pencil className="size-3" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="flex items-center gap-2 text-xs text-destructive"
                      onClick={e => { e.stopPropagation(); handleDeleteCollection(col.id); }}
                    >
                      <Trash2 className="size-3" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>

        {/* New collection button */}
        <div className="border-t px-2 py-2">
          <NewCollectionDialog onCreated={handleCollectionCreated} />
        </div>
      </div>

      {/* ── Right: Requests panel ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {!selectedCollection ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <FolderOpen className="size-7" />
            </div>
            <p className="text-sm font-medium">Select a collection</p>
            <p className="text-xs">or create one to get started</p>
          </div>
        ) : (
          <>
            {/* Panel header */}
            <div className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
              <FolderOpen className="size-4 text-orange-500" />
              <div className="flex-1 min-w-0">
                <InlineEdit
                  value={selectedCollection.name}
                  onSave={name => handleRenameCollection(selectedCollection.id, name)}
                  className="text-sm font-semibold"
                />
                {selectedCollection.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {selectedCollection.description}
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {requests.length} {requests.length === 1 ? "request" : "requests"}
              </span>
            </div>

            {/* Requests list */}
            <div className="flex-1 overflow-auto">
              {loadingRequests ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              ) : requests.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                  <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                    <FileText className="size-6" />
                  </div>
                  <p className="text-sm font-medium">No saved requests</p>
                  <p className="text-xs max-w-[20rem] text-center">
                    Open any request in the editor and click{" "}
                    <span className="font-medium text-foreground">Save to collection</span> to add it here.
                  </p>
                </div>
              ) : (
                <div>
                  {requests.map(req => (
                    <div
                      key={req.id}
                      className="group flex cursor-pointer items-center gap-3 border-b px-4 py-3 text-xs hover:bg-muted/30 transition"
                      onClick={() => handleOpenRequest(req)}
                    >
                      {/* Method badge */}
                      <span className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold",
                        METHOD_COLORS[req.method] ?? "text-slate-600 bg-slate-100",
                      )}>
                        {req.method}
                      </span>

                      {/* Name + URL */}
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate font-medium text-foreground">{req.name}</span>
                        <span className="flex items-center gap-1 truncate text-muted-foreground font-mono">
                          <Globe className="size-2.5 shrink-0" />
                          {req.url || <span className="italic">no url</span>}
                        </span>
                      </div>

                      {/* Open hint */}
                      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />

                      {/* Actions */}
                      <div
                        className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleOpenRequest(req)}
                          title="Open in editor"
                          className="flex size-6 items-center justify-center rounded text-muted-foreground transition hover:bg-orange-100 hover:text-orange-600 dark:hover:bg-orange-950/40"
                        >
                          <RotateCw className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(req.id)}
                          title="Delete"
                          className="flex size-6 items-center justify-center rounded text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
