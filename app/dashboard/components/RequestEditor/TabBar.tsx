"use client";

import { useRef, useState } from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RequestTab } from "./index";

const METHOD_COLORS: Record<string, string> = {
  GET:     "text-emerald-600",
  POST:    "text-amber-500",
  PUT:     "text-blue-500",
  PATCH:   "text-violet-500",
  DELETE:  "text-red-500",
  HEAD:    "text-slate-500",
  OPTIONS: "text-slate-500",
};

type Props = {
  tabs: RequestTab[];
  activeTabId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
};

function EditableTabName({
  tabId,
  name,
  onRename,
}: {
  tabId: string;
  name: string;
  onRename: (id: string, name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setDraft(name || "untitled");
    setEditing(true);
    // Focus after render
    setTimeout(() => {
      inputRef.current?.select();
    }, 0);
  }

  function commit() {
    const trimmed = draft.trim();
    onRename(tabId, trimmed || "untitled");
    setEditing(false);
  }

  function cancel() {
    setDraft(name);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { e.preventDefault(); cancel(); }
          e.stopPropagation();
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-24 min-w-0 rounded border border-orange-400 bg-background px-1 py-0 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-orange-400/40"
        autoFocus
      />
    );
  }

  return (
    <span
      className="max-w-24 truncate font-medium"
      onDoubleClick={startEdit}
      title="Double-click to rename"
    >
      {name || "untitled"}
    </span>
  );
}

export function TabBar({ tabs, activeTabId, onSelect, onClose, onAdd, onRename }: Props) {
  return (
    <div className="flex h-10 shrink-0 items-center border-b bg-muted/40 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={cn(
            "group flex h-full shrink-0 items-center gap-1.5 border-r px-3 text-xs transition-colors",
            tab.id === activeTabId
              ? "bg-background text-foreground"
              : "text-muted-foreground hover:bg-background/60",
          )}
        >
          <span className={cn("font-bold text-[10px] uppercase", METHOD_COLORS[tab.method])}>
            {tab.method}
          </span>

          <EditableTabName
            tabId={tab.id}
            name={tab.name}
            onRename={onRename}
          />

          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
            onKeyDown={(e) => e.key === "Enter" && onClose(tab.id)}
            className="ml-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
            aria-label="Close tab"
          >
            <X className="size-3" />
          </span>
        </button>
      ))}

      <button
        onClick={onAdd}
        aria-label="New request"
        className="flex h-full items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
