let bootstrapped = false;

async function enableVConsole(): Promise<void> {
  if (bootstrapped) return;
  bootstrapped = true;
  const { default: VConsole } = await import("vconsole");
  new VConsole();
}

export async function setupVConsoleFromUrl(): Promise<void> {
  if (typeof window === "undefined") return;
  await enableVConsole();
}

export function handleVConsoleVersionTap(onToast: (message: string) => void): void {
  if (typeof window === "undefined") return;
  onToast("调试面板已开启");
}
