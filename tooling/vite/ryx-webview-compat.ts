const directionalOklab = /\b(to (?:top|right|bottom|left)(?: (?:right|left))?) in oklab\b/g;

type CssAsset = {
  type: "asset";
  fileName: string;
  source: string | Uint8Array;
};

type BuildOutput = Record<string, CssAsset | { type: "chunk" }>;

/** Remove Tailwind v4's unsupported gradient interpolation from release CSS. */
export function ryxWebviewCompat() {
  return {
    name: "ryx-webview-compat",
    apply: "build" as const,
    generateBundle(_options: unknown, bundle: BuildOutput) {
      for (const asset of Object.values(bundle)) {
        if (asset.type !== "asset" || !asset.fileName.endsWith(".css")) continue;
        if (typeof asset.source !== "string") continue;
        asset.source = asset.source.replace(directionalOklab, "$1");
      }
    },
  };
}
