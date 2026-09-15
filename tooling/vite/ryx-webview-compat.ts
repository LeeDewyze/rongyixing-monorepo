import postcss from "postcss";

const directionalOklab = /\b(to (?:top|right|bottom|left)(?: (?:right|left))?) in oklab\b/g;
const oklabColor =
  /oklab\(\s*([+-]?(?:\d*\.)?\d+)%?\s+([+-]?(?:\d*\.)?\d+)%?\s+([+-]?(?:\d*\.)?\d+)%?(?:\s*\/\s*([^)]+))?\s*\)/gi;
const modernRgbColor =
  /\brgb\(\s*([^,\s/]+)\s+([^,\s/]+)\s+([^,\s/]+)\s*\/\s*([^)]+)\)/gi;
const modernCssUnit =
  /(-?(?:\d+|\d*\.\d+))(cqw|cqh|cqi|cqb|cqmin|cqmax|dvw|svw|lvw|dvh|svh|lvh|lh|rlh)\b/g;

type CssAsset = {
  type: "asset";
  fileName: string;
  source: string | Uint8Array;
};

type BuildOutput = Record<string, CssAsset | { type: "chunk" }>;

type FallbackFactory = (value: string) => Array<[string, string]>;

const logicalPropertyFallbacks: Record<string, FallbackFactory> = {
  inset: (value) => {
    const [top, right = top, bottom = top, left = right] = splitTopLevelWhitespace(value);
    return [
      ["top", top],
      ["right", right],
      ["bottom", bottom],
      ["left", left],
    ];
  },
  "inset-inline": (value) => {
    const [left, right = left] = splitTopLevelWhitespace(value);
    return [
      ["left", left],
      ["right", right],
    ];
  },
  "inset-inline-start": (value) => [["left", value]],
  "inset-inline-end": (value) => [["right", value]],
  "inset-block": (value) => {
    const [top, bottom = top] = splitTopLevelWhitespace(value);
    return [
      ["top", top],
      ["bottom", bottom],
    ];
  },
  "inset-block-start": (value) => [["top", value]],
  "inset-block-end": (value) => [["bottom", value]],
  "margin-inline": (value) => {
    const [left, right = left] = splitTopLevelWhitespace(value);
    return [
      ["margin-left", left],
      ["margin-right", right],
    ];
  },
  "margin-inline-start": (value) => [["margin-left", value]],
  "margin-inline-end": (value) => [["margin-right", value]],
  "margin-block": (value) => {
    const [top, bottom = top] = splitTopLevelWhitespace(value);
    return [
      ["margin-top", top],
      ["margin-bottom", bottom],
    ];
  },
  "margin-block-start": (value) => [["margin-top", value]],
  "margin-block-end": (value) => [["margin-bottom", value]],
  "padding-inline": (value) => {
    const [left, right = left] = splitTopLevelWhitespace(value);
    return [
      ["padding-left", left],
      ["padding-right", right],
    ];
  },
  "padding-inline-start": (value) => [["padding-left", value]],
  "padding-inline-end": (value) => [["padding-right", value]],
  "padding-block": (value) => {
    const [top, bottom = top] = splitTopLevelWhitespace(value);
    return [
      ["padding-top", top],
      ["padding-bottom", bottom],
    ];
  },
  "padding-block-start": (value) => [["padding-top", value]],
  "padding-block-end": (value) => [["padding-bottom", value]],
  "border-block-width": (value) => {
    const [top, bottom = top] = splitTopLevelWhitespace(value);
    return [
      ["border-top-width", top],
      ["border-bottom-width", bottom],
    ];
  },
  "border-block-style": (value) => {
    const [top, bottom = top] = splitTopLevelWhitespace(value);
    return [
      ["border-top-style", top],
      ["border-bottom-style", bottom],
    ];
  },
  "border-block-color": (value) => {
    const [top, bottom = top] = splitTopLevelWhitespace(value);
    return [
      ["border-top-color", top],
      ["border-bottom-color", bottom],
    ];
  },
  "border-block-start-width": (value) => [["border-top-width", value]],
  "border-block-end-width": (value) => [["border-bottom-width", value]],
  "border-block-start-style": (value) => [["border-top-style", value]],
  "border-block-end-style": (value) => [["border-bottom-style", value]],
  "border-block-start-color": (value) => [["border-top-color", value]],
  "border-block-end-color": (value) => [["border-bottom-color", value]],
  "border-inline-width": (value) => {
    const [left, right = left] = splitTopLevelWhitespace(value);
    return [
      ["border-left-width", left],
      ["border-right-width", right],
    ];
  },
  "border-inline-style": (value) => {
    const [left, right = left] = splitTopLevelWhitespace(value);
    return [
      ["border-left-style", left],
      ["border-right-style", right],
    ];
  },
  "border-inline-color": (value) => {
    const [left, right = left] = splitTopLevelWhitespace(value);
    return [
      ["border-left-color", left],
      ["border-right-color", right],
    ];
  },
  "border-inline-start-width": (value) => [["border-left-width", value]],
  "border-inline-end-width": (value) => [["border-right-width", value]],
  "border-inline-start-style": (value) => [["border-left-style", value]],
  "border-inline-end-style": (value) => [["border-right-style", value]],
  "border-inline-start-color": (value) => [["border-left-color", value]],
  "border-inline-end-color": (value) => [["border-right-color", value]],
};

function splitTopLevelWhitespace(value: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let depth = 0;
  let quote = "";

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (quote) {
      if (char === quote && value[index - 1] !== "\\") quote = "";
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }
    if (char === "(") {
      depth += 1;
      continue;
    }
    if (char === ")") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth === 0 && /\s/.test(char)) {
      if (start < index) parts.push(value.slice(start, index));
      start = index + 1;
    }
  }

  if (start < value.length) parts.push(value.slice(start));
  return parts;
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function gammaEncode(value: number): number {
  const encoded = value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
  return clamp(encoded);
}

function convertOklabColor(match: string, lightness: string, a: string, b: string, alpha?: string) {
  const l = Number(lightness) / 100;
  const aValue = Number(a);
  const bValue = Number(b);

  const lPrime = l + 0.3963377774 * aValue + 0.2158037573 * bValue;
  const mPrime = l - 0.1055613458 * aValue - 0.0638541728 * bValue;
  const sPrime = l - 0.0894841775 * aValue - 1.291485548 * bValue;
  const lmsL = lPrime ** 3;
  const lmsM = mPrime ** 3;
  const lmsS = sPrime ** 3;

  const red = gammaEncode(4.0767416621 * lmsL - 3.3077115913 * lmsM + 0.2309699292 * lmsS);
  const green = gammaEncode(-1.2684380046 * lmsL + 2.6097574011 * lmsM - 0.3413193965 * lmsS);
  const blue = gammaEncode(-0.0041960863 * lmsL - 0.7034186147 * lmsM + 1.707614701 * lmsS);
  const opacity = alpha?.trim() || "1";

  if (![red, green, blue].every(Number.isFinite)) return match;

  return `rgba(${Math.round(red * 255)}, ${Math.round(green * 255)}, ${Math.round(
    blue * 255,
  )}, ${opacity})`;
}

function replaceUnsupportedColorSyntax(value: string): string {
  return value
    .replace(oklabColor, convertOklabColor)
    .replace(modernRgbColor, "rgba($1, $2, $3, $4)");
}

function replaceUnsupportedUnitSyntax(value: string): string {
  return value.replace(modernCssUnit, (_match, amount: string, unit: string) => {
    const fallbackUnit =
      unit === "cqh" || unit === "cqb" || unit === "dvh" || unit === "svh" || unit === "lvh"
        ? "vh"
        : unit === "cqmin"
          ? "vmin"
          : unit === "cqmax"
            ? "vmax"
            : unit === "lh"
              ? "em"
              : unit === "rlh"
                ? "rem"
                : "vw";
    return `${amount}${fallbackUnit}`;
  });
}

function addLogicalPropertyFallbacks(root: postcss.Root) {
  root.walkDecls((decl) => {
    const fallbackFactory = logicalPropertyFallbacks[decl.prop];
    if (fallbackFactory) {
      for (const [property, value] of fallbackFactory(decl.value)) {
        decl.cloneBefore({ prop: property, value });
      }
    }

    if (decl.prop === "overflow" && decl.value === "clip") {
      decl.cloneBefore({ value: "hidden" });
    }
    if (decl.prop === "overflow-x" && decl.value === "clip") {
      decl.cloneBefore({ value: "hidden" });
    }
    if (decl.prop === "overflow-y" && decl.value === "clip") {
      decl.cloneBefore({ value: "hidden" });
    }
  });
}

function addModernUnitFallbacks(root: postcss.Root) {
  root.walkDecls((decl) => {
    const fallbackValue = replaceUnsupportedUnitSyntax(decl.value);
    if (fallbackValue !== decl.value) {
      decl.cloneBefore({ value: fallbackValue });
    }
  });
}

function addContainerQueryFallbacks(root: postcss.Root) {
  root.walkAtRules("container", (atRule) => {
    if (!atRule.nodes || !atRule.parent) return;

    // The current app uses unnamed width queries. Preserve a conservative
    // viewport-media fallback for WebViews that do not understand @container.
    const mediaParams = atRule.params.replace(
      /^[\w-]+\s*(?=\(min-width|\(max-width)/,
      "",
    );
    if (!/^\s*\((?:min|max)-width\s*:/.test(mediaParams)) return;

    const fallback = postcss.atRule({
      name: "media",
      params: mediaParams.trim(),
    });
    fallback.append(
      atRule.nodes.map((node) => node.clone()),
    );
    atRule.parent.insertBefore(atRule, fallback);
  });
}

function buildLegacyTransformFallback(rule: postcss.Rule): postcss.Declaration[] | null {
  const declarations =
    rule.nodes?.filter(
      (node): node is postcss.Declaration =>
        node.type === "decl" && ["translate", "rotate", "scale"].includes(node.prop),
    ) ?? [];
  if (!declarations.length) return null;

  const translate = declarations.some((decl) => decl.prop === "translate");
  const rotate = declarations.find((decl) => decl.prop === "rotate");
  const scale = declarations.find((decl) => decl.prop === "scale");
  const fallbackDeclarations: postcss.Declaration[] = [];

  if (translate) {
    fallbackDeclarations.push(
      postcss.decl({
        prop: "--ryx-legacy-translate-x",
        value: "var(--tw-translate-x, 0)",
      }),
      postcss.decl({
        prop: "--ryx-legacy-translate-y",
        value: "var(--tw-translate-y, 0)",
      }),
    );
  }
  if (rotate) {
    fallbackDeclarations.push(
      postcss.decl({
        prop: "--ryx-legacy-rotate",
        value: rotate.value,
      }),
    );
  }
  if (scale) {
    if (scale.value.includes("--tw-scale-x") || scale.value.includes("--tw-scale-y")) {
      fallbackDeclarations.push(
        postcss.decl({
          prop: "--ryx-legacy-scale-x",
          value: "var(--tw-scale-x, 1)",
        }),
        postcss.decl({
          prop: "--ryx-legacy-scale-y",
          value: "var(--tw-scale-y, 1)",
        }),
      );
    } else {
      fallbackDeclarations.push(
        postcss.decl({
          prop: "--ryx-legacy-scale-x",
          value: scale.value,
        }),
        postcss.decl({
          prop: "--ryx-legacy-scale-y",
          value: scale.value,
        }),
      );
    }
  }

  fallbackDeclarations.push(
    postcss.decl({
      prop: "transform",
      value:
        "translate(var(--ryx-legacy-translate-x, 0), var(--ryx-legacy-translate-y, 0)) " +
        "rotate(var(--ryx-legacy-rotate, 0deg)) " +
        "scale(var(--ryx-legacy-scale-x, 1), var(--ryx-legacy-scale-y, 1))",
    }),
  );
  return fallbackDeclarations;
}

function addLegacyTransformFallbacks(root: postcss.Root) {
  root.walkRules((rule) => {
    const declarations = buildLegacyTransformFallback(rule);
    if (!declarations || !rule.parent) return;

    const fallback = postcss.atRule({
      name: "supports",
      params: "not (translate: 1px)",
    });
    fallback.append(
      rule.clone({
        nodes: declarations,
      }),
    );
    rule.parent.insertAfter(rule, fallback);
  });
}

async function addWebviewFallbacks(css: string): Promise<string> {
  const result = await postcss([
    {
      postcssPlugin: "ryx-webview-fallbacks",
      Once(root) {
        root.walkDecls((decl) => {
          decl.value = replaceUnsupportedColorSyntax(decl.value);
        });
        addModernUnitFallbacks(root);
        addLogicalPropertyFallbacks(root);
        addContainerQueryFallbacks(root);
        addLegacyTransformFallbacks(root);
      },
    },
  ]).process(css, { from: undefined });
  return result.css;
}

/**
 * Remove CSS cascade-layer wrappers (`@layer theme { ... }`) from release CSS.
 * Older Android WebViews (< Chrome 99) do not support `@layer` and drop the
 * whole block, which blanks out every Tailwind v4 style.
 */
export async function stripCascadeLayers(css: string): Promise<string> {
  const result = await postcss([
    {
      postcssPlugin: "ryx-strip-cascade-layers",
      OnceExit(root) {
        root.walkAtRules("layer", (atRule) => {
          if (!atRule.nodes) {
            atRule.remove();
            return;
          }
          atRule.replaceWith(atRule.nodes);
        });
      },
    },
  ]).process(css, { from: undefined });
  return result.css;
}

export async function makeWebviewCompatibleCss(css: string): Promise<string> {
  let source = css.replace(directionalOklab, "$1");
  source = await stripCascadeLayers(source);
  return addWebviewFallbacks(source);
}

/** Make Tailwind v4 CSS usable by older Android WebViews. */
export function ryxWebviewCompat() {
  return {
    name: "ryx-webview-compat",
    apply: "build" as const,
    async generateBundle(_options: unknown, bundle: BuildOutput) {
      for (const asset of Object.values(bundle)) {
        if (asset.type !== "asset" || !asset.fileName.endsWith(".css")) continue;
        if (typeof asset.source !== "string") continue;
        asset.source = await makeWebviewCompatibleCss(asset.source);
      }
    },
  };
}
