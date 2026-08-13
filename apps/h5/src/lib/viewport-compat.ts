const MIN_DESIGN_WIDTH = 320;
const MAX_DESIGN_WIDTH = 480;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getViewportSize() {
  const visualViewport = window.visualViewport;
  const width = visualViewport?.width || window.innerWidth || document.documentElement.clientWidth;
  const height =
    visualViewport?.height || window.innerHeight || document.documentElement.clientHeight;

  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
}

function writeViewportVars() {
  const { width, height } = getViewportSize();
  const designWidth = clamp(width, MIN_DESIGN_WIDTH, MAX_DESIGN_WIDTH);
  const root = document.documentElement;

  root.style.setProperty("--ryx-viewport-width", `${width}px`);
  root.style.setProperty("--ryx-viewport-height", `${height}px`);
  root.style.setProperty("--ryx-design-width", `${designWidth}px`);
  root.style.setProperty("--ryx-design-vw", `${designWidth / 100}px`);
  root.style.setProperty("--ryx-design-scale", `${designWidth / 375}`);
}

export function setupViewportCompatibilityVars() {
  if (typeof window === "undefined") return;

  writeViewportVars();

  let rafId = 0;
  const scheduleWrite = () => {
    window.cancelAnimationFrame(rafId);
    rafId = window.requestAnimationFrame(writeViewportVars);
  };

  window.addEventListener("resize", scheduleWrite, { passive: true });
  window.addEventListener("orientationchange", scheduleWrite, { passive: true });
  window.visualViewport?.addEventListener("resize", scheduleWrite, { passive: true });
}
