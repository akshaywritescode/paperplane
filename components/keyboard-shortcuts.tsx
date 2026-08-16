"use client";

import { useState, useEffect } from "react";
import { Keyboard, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Shortcut data ────────────────────────────────────────────────────────────

type ShortcutEntry = {
  keys: string[][];   // each inner array is one key combo; outer = alternatives
  label: string;
};

type ShortcutGroup = {
  title: string;
  items: ShortcutEntry[];
};

function useIsMac() {
  const [mac, setMac] = useState(false);
  useEffect(() => {
    setMac(/mac/i.test(navigator.userAgent) && !/windows/i.test(navigator.userAgent));
  }, []);
  return mac;
}

function buildShortcuts(mac: boolean): ShortcutGroup[] {
  const mod = mac ? "⌘" : "Ctrl";
  const alt = mac ? "⌥" : "Alt";

  return [
    {
      title: "Global",
      items: [
        { keys: [["?"]], label: "Open this shortcuts panel" },
        { keys: [[mod, "/"]], label: "Open this shortcuts panel" },
        { keys: [[mod, "B"]], label: "Toggle sidebar" },
      ],
    },
    {
      title: "Request Editor",
      items: [
        { keys: [["Enter"]], label: "Send request (focus URL bar)" },
        { keys: [[alt, "R"], [mod, "R"]], label: "Send to Repeater" },
        { keys: [["Escape"]], label: "Cancel in-flight request" },
      ],
    },
    {
      title: "Response Pane",
      items: [
        { keys: [[mod, "F"]], label: "Focus search bar" },
        { keys: [["F3"], ["Enter"]], label: "Next search match" },
        { keys: [["Shift", "F3"], ["Shift", "Enter"]], label: "Previous search match" },
      ],
    },
    {
      title: "Tabs",
      items: [
        { keys: [[mod, "T"]], label: "New request tab" },
        { keys: [[mod, "W"]], label: "Close current tab" },
        { keys: [[mod, "1–9"]], label: "Switch to tab by number" },
      ],
    },
    {
      title: "Mock Server — Body Editor",
      items: [
        { keys: [["Tab"]], label: "Indent (insert 2 spaces)" },
      ],
    },
  ];
}

// ─── Key chip ─────────────────────────────────────────────────────────────────

function KeyChip({ k }: { k: string }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-[11px] font-semibold text-foreground shadow-[0_1px_0] shadow-border">
      {k}
    </kbd>
  );
}

function Combo({ keys }: { keys: string[] }) {
  return (
    <span className="flex items-center gap-0.5">
      {keys.map((k, i) => <KeyChip key={i} k={k} />)}
    </span>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const mac    = useIsMac();
  const groups = buildShortcuts(mac);

  // Close on Escape or ? again
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <Keyboard className="size-4 text-orange-500" />
            <h2 className="text-sm font-semibold">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Groups */}
        <div className="max-h-[50vh] overflow-y-auto px-5 py-4 space-y-5">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {group.title}
              </p>
              <div className="rounded-xl border divide-y overflow-hidden">
                {group.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors"
                  >
                    <span className="text-xs text-foreground">{item.label}</span>
                    {/* Show alternatives separated by "or" */}
                    <div className="flex shrink-0 items-center gap-1.5">
                      {item.keys.map((combo, ci) => (
                        <span key={ci} className="flex items-center gap-1">
                          {ci > 0 && (
                            <span className="text-[10px] text-muted-foreground">or</span>
                          )}
                          <Combo keys={combo} />
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="border-t px-5 py-3 text-center text-[11px] text-muted-foreground">
          Press <KeyChip k="?" /> or <KeyChip k="Esc" /> to dismiss
        </div>
      </div>
    </div>
  );
}

// ─── Button + global trigger ──────────────────────────────────────────────────

export function KeyboardShortcutsButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      // ? — only when not typing in an input
      if (e.key === "?" && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      // ⌘/ or Ctrl+/
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Keyboard shortcuts (?)"
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label="Keyboard shortcuts"
      >
        <Keyboard className="size-4" />
      </button>

      {open && <ShortcutsModal onClose={() => setOpen(false)} />}
    </>
  );
}
