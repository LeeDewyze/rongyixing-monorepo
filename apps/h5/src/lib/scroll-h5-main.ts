/** Scroll the H5Shell `<main>` container to top (not `window`). */
export function scrollH5MainToTop(): void {
  const main = document.querySelector<HTMLElement>("main.overflow-y-auto");
  if (!main) return;
  main.scrollTop = 0;
  main.scrollTo({ top: 0, behavior: "auto" });
}

/** Retry scroll after layout/paint — needed when content height changes after fetch. */
export function scrollH5MainToTopAfterLayout(): void {
  scrollH5MainToTop();
  requestAnimationFrame(() => {
    scrollH5MainToTop();
    requestAnimationFrame(scrollH5MainToTop);
  });
}
