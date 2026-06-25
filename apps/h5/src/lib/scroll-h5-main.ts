/** Scroll the H5Shell `<main>` container to top (not `window`). */
export function scrollH5MainToTop(): void {
  const main = document.querySelector<HTMLElement>("main.overflow-y-auto");
  main?.scrollTo({ top: 0, behavior: "auto" });
}
