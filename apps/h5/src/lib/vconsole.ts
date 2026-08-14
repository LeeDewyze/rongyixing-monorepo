let bootstrapped = false;
const VCONSOLE_ENABLED = import.meta.env.VITE_ENABLE_VCONSOLE !== "false";

async function enableVConsole(): Promise<void> {
  if (!VCONSOLE_ENABLED || bootstrapped) return;
  bootstrapped = true;
  const { default: VConsole } = await import("vconsole");
  new VConsole();
}

export async function setupVConsoleFromUrl(): Promise<void> {
  if (typeof window === "undefined" || !VCONSOLE_ENABLED) return;
  await enableVConsole();
}

export function handleVConsoleVersionTap(onToast: (message: string) => void): void {
  if (typeof window === "undefined") return;
  if (!VCONSOLE_ENABLED) {
    onToast("当前版本未包含调试面板");
    return;
  }
  onToast("调试面板已开启");
}
