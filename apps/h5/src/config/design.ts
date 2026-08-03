/** Shared MasterGo artboard size (750×1624 @2x mobile canvas). */
export const DESIGN_CANVAS = {
  width: 750,
  height: 1624,
} as const;

export const PINGFANG_FONT =
  '"苹方-简", "PingFang SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export function designWidthPercent(px: number): string {
  return `${(px / DESIGN_CANVAS.width) * 100}%`;
}

export function designHeightPercent(px: number): string {
  return `${(px / DESIGN_CANVAS.height) * 100}%`;
}

/** Scales design px against 750-wide artboard via container query width. */
export function designCqw(px: number): string {
  return `${(px / DESIGN_CANVAS.width) * 100}cqw`;
}
