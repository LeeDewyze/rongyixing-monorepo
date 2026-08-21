import postcss from "postcss";

const directionalOklab = /\b(to (?:top|right|bottom|left)(?: (?:right|left))?) in oklab\b/g;

type CssAsset = {
  type: "asset";
  fileName: string;
  source: string | Uint8Array;
};

type BuildOutput = Record<string, CssAsset | { type: "chunk" }>;

/**
 * Remove CSS cascade-layer wrappers (`@layer theme { ... }`) from release CSS.
 * Older Android WebViews (< Chrome 99) do not support `@layer` and drop the
 * whole block, which blanks out every Tailwind v4 style. Hoisting the inner
 * rules keeps the original file order (theme → base → components → utilities),
 * so the cascade priority is preserved even without layers.
 */
export async function stripCascadeLayers(css: string): Promise<string> {
  const result = await postcss([
    {
      postcssPlugin: "ryx-strip-cascade-layers",
      OnceExit(root) {
        root.walkAtRules("layer", (atRule) => {
          if (!atRule.nodes) {
            // Statement form: `@layer theme, base;` — no rules, drop it.
            atRule.remove();
            return;
          }
          // Block form: `@layer utilities { ... }` — keep the inner rules in place.
          atRule.replaceWith(atRule.nodes);
        });
      },
    },
  ]).process(css, { from: undefined });
  return result.css;
}

/** Make Tailwind v4 CSS parseable by older Android WebViews. */
export function ryxWebviewCompat() {
  return {
    name: "ryx-webview-compat",
    apply: "build" as const,
    async generateBundle(_options: unknown, bundle: BuildOutput) {
      for (const asset of Object.values(bundle)) {
        if (asset.type !== "asset" || !asset.fileName.endsWith(".css")) continue;
        if (typeof asset.source !== "string") continue;
        let source = asset.source.replace(directionalOklab, "$1");
        source = await stripCascadeLayers(source);
        asset.source = source;
      }
    },
  };
}
