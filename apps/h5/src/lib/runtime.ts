type CapacitorRuntime = {
  isNativePlatform?: () => boolean;
};

type RuntimeWindow = Window & {
  Capacitor?: CapacitorRuntime;
};

/**
 * Detect the Capacitor shell at runtime so the same H5 build can be used by
 * browsers and Android without a build-time environment flag.
 */
export function isNativeCapacitorRuntime(): boolean {
  if (typeof window === "undefined") return false;

  return (window as RuntimeWindow).Capacitor?.isNativePlatform?.() === true;
}
