const VCONSOLE_ENABLED = import.meta.env.VITE_ENABLE_VCONSOLE !== "false";
const VCONSOLE_TAP_TO_ENABLE = import.meta.env.VITE_VCONSOLE_TAP_TO_ENABLE === "true";
const VERSION_TAP_THRESHOLD = 5;
const VERSION_TAP_WINDOW_MS = 2_000;

let vConsoleEnabled = false;
let enablePromise: Promise<void> | null = null;
let versionTapCount = 0;
let versionTapResetTimer: number | null = null;

async function enableVConsole(): Promise<void> {
  if (!VCONSOLE_ENABLED || vConsoleEnabled) return;
  if (enablePromise) return enablePromise;

  enablePromise = import("vconsole")
    .then(({ default: VConsole }) => {
      new VConsole();
      vConsoleEnabled = true;
    })
    .finally(() => {
      enablePromise = null;
    });

  return enablePromise;
}

export async function setupVConsoleFromUrl(): Promise<void> {
  if (typeof window === "undefined" || !VCONSOLE_ENABLED) return;
  if (!VCONSOLE_TAP_TO_ENABLE) {
    await enableVConsole();
  }
}

export function handleVConsoleVersionTap(onToast: (message: string) => void): void {
  if (typeof window === "undefined") return;
  if (!VCONSOLE_ENABLED) {
    onToast("当前版本未包含调试面板");
    return;
  }

  if (vConsoleEnabled || !VCONSOLE_TAP_TO_ENABLE) {
    onToast("调试面板已开启");
    return;
  }

  versionTapCount += 1;
  if (versionTapResetTimer !== null) {
    window.clearTimeout(versionTapResetTimer);
  }
  versionTapResetTimer = window.setTimeout(() => {
    versionTapCount = 0;
    versionTapResetTimer = null;
  }, VERSION_TAP_WINDOW_MS);

  if (versionTapCount < VERSION_TAP_THRESHOLD) return;

  versionTapCount = 0;
  window.clearTimeout(versionTapResetTimer);
  versionTapResetTimer = null;
  void enableVConsole()
    .then(() => onToast("调试面板已开启"))
    .catch(() => onToast("调试面板开启失败，请重试"));
}
