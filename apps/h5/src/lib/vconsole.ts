const VCONSOLE_STORAGE_KEY = "ryx_vconsole_enabled";
const VCONSOLE_URL_KEY = "vconsole";

let bootstrapped = false;

function readUrlSwitch(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(VCONSOLE_URL_KEY);
}

function persistUrlSwitch(value: string | null): void {
  if (typeof localStorage === "undefined") return;
  if (value === "1") {
    localStorage.setItem(VCONSOLE_STORAGE_KEY, "1");
    return;
  }
  if (value === "0") {
    localStorage.removeItem(VCONSOLE_STORAGE_KEY);
  }
}

function shouldEnableVConsole(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(VCONSOLE_STORAGE_KEY) === "1";
}

export async function setupVConsoleFromUrl(): Promise<void> {
  if (bootstrapped || typeof window === "undefined") return;

  const urlSwitch = readUrlSwitch();
  persistUrlSwitch(urlSwitch);

  if (!shouldEnableVConsole()) return;

  bootstrapped = true;
  const { default: VConsole } = await import("vconsole");
  new VConsole();
}
