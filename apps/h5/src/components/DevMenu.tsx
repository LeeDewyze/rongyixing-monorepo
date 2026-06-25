import { useState } from "react";

import { getApiMode, setApiMode, clearApiModeOverride } from "@/lib/env";
import { resetApi } from "@/lib/api";

const MODES = [
  { value: "mock" as const, label: "Mock" },
  { value: "proxy" as const, label: "Test/Proxy" },
  { value: "direct" as const, label: "Direct" },
];

export function DevMenu() {
  const [open, setOpen] = useState(false);
  const current = getApiMode();

  if (!import.meta.env.DEV || import.meta.env.VITE_SHOW_DEV_MENU !== "true") return null;

  function switchMode(mode: "mock" | "proxy" | "direct") {
    clearApiModeOverride();
    setApiMode(mode);
    resetApi();
    window.location.reload();
  }

  return (
    <>
      <button
        type="button"
        className="fixed bottom-20 right-3 z-50 rounded-full bg-black/70 px-3 py-1 text-xs text-white"
        onClick={() => setOpen((v) => !v)}
      >
        DEV
      </button>
      {open ? (
        <div className="fixed bottom-28 right-3 z-50 w-40 rounded-lg border bg-background p-2 shadow-lg">
          <p className="mb-2 text-xs text-muted-foreground">
            API: {current}
            <br />
            {import.meta.env.VITE_API_BASE_URL || "(relative)"}
          </p>
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              className={`mb-1 block w-full rounded px-2 py-1 text-left text-sm ${
                current === m.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
              onClick={() => switchMode(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
