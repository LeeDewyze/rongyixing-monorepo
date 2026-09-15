import { describe, expect, it } from "vitest";

import {
  makeWebviewCompatibleCss,
  stripCascadeLayers,
} from "../../../../tooling/vite/ryx-webview-compat";

function braceBalance(css: string): boolean {
  const open = (css.match(/{/g) ?? []).length;
  const close = (css.match(/}/g) ?? []).length;
  return open === close;
}

describe("stripCascadeLayers", () => {
  it("hoists rules out of layer blocks and keeps their order", async () => {
    const css = [
      "@layer theme {",
      "  :root { --color-brand: #2768fa; }",
      "}",
      "@layer base {",
      "  * { box-sizing: border-box; }",
      "}",
      "@layer utilities {",
      "  .flex { display: flex; }",
      "  .p-4 { padding: 1rem; }",
      "}",
    ].join("\n");

    const out = await stripCascadeLayers(css);
    expect(out).not.toContain("@layer");
    expect(out).toContain(":root { --color-brand: #2768fa; }");
    expect(out).toContain("* { box-sizing: border-box; }");
    expect(out).toContain(".flex { display: flex; }");
    expect(out).toContain(".p-4 { padding: 1rem; }");
    // Order preserved: theme before base before utilities.
    expect(out.indexOf(":root")).toBeLessThan(out.indexOf("box-sizing"));
    expect(out.indexOf("box-sizing")).toBeLessThan(out.indexOf(".flex"));
    expect(braceBalance(out)).toBe(true);
  });

  it("removes bare layer statements (`@layer a, b;`)", async () => {
    const css = "@layer theme, base, components, utilities;\n.foo { color: red; }";

    const out = await stripCascadeLayers(css);
    expect(out).not.toContain("@layer");
    expect(out).toContain(".foo { color: red; }");
  });

  it("keeps nested @media and @supports rules intact", async () => {
    const css = [
      "@layer utilities {",
      "  .card { display: grid; }",
      "  @media (min-width: 768px) { .card { grid-template-columns: 1fr auto; } }",
      "  @supports (display: grid) { .grid-ok { display: grid; } }",
      "}",
    ].join("\n");

    const out = await stripCascadeLayers(css);
    expect(out).not.toContain("@layer");
    expect(out).toContain("@media (min-width: 768px)");
    expect(out).toContain("@supports (display: grid)");
    expect(out).toContain(".card { display: grid; }");
    expect(braceBalance(out)).toBe(true);
  });

  it("does not touch modern syntax that falls outside this fix", async () => {
    const css = [
      "@layer utilities {",
      "  .has-icon:has(> svg) { display: grid; }",
      "}",
      "@property --tw-shadow { syntax: \"*\"; inherits: false; initial-value: 0 0 #0000; }",
      ".bar { color: rgb(from red r g b); }",
    ].join("\n");

    const out = await stripCascadeLayers(css);
    expect(out).toContain(".has-icon:has(> svg) { display: grid; }");
    expect(out).toContain("@property --tw-shadow");
    expect(out).toContain("rgb(from red r g b)");
    expect(braceBalance(out)).toBe(true);
  });

  it("leaves gradient interpolation untouched (handled by the oklab regex separately)", async () => {
    const css = ".btn { background-image: linear-gradient(to right in oklab, #33a1f9, #2768fa); }";

    const out = await stripCascadeLayers(css);
    expect(out).toContain("to right in oklab");
    expect(out).toContain(".btn");
  });

  it("is a no-op on CSS without layers", async () => {
    const css = ".a { color: red; } .b { color: blue; }";

    const out = await stripCascadeLayers(css);
    expect(out).toBe(css);
  });

  it("adds legacy fallbacks for Tailwind v4 transform and logical properties", async () => {
    const css = [
      ".translate-x-2 { --tw-translate-x: 0.5rem; translate: var(--tw-translate-x)var(--tw-translate-y); }",
      ".px-4 { padding-inline: 1rem; }",
      ".absolute-inset { inset-inline: 0; }",
      ".clipped { overflow: clip; }",
    ].join("\n");

    const out = await makeWebviewCompatibleCss(css);
    expect(out).toContain("@supports not (translate: 1px)");
    expect(out).toContain(
      "transform: translate(var(--ryx-legacy-translate-x, 0), var(--ryx-legacy-translate-y, 0))",
    );
    expect(out).toContain("padding-left: 1rem");
    expect(out).toContain("padding-right: 1rem");
    expect(out).toContain("left: 0");
    expect(out).toContain("right: 0");
    expect(out).toContain("overflow: hidden");
    expect(out).toContain("translate: var(--tw-translate-x)var(--tw-translate-y)");
  });

  it("converts OKLab and modern RGB colors to broadly supported syntax", async () => {
    const css = [
      ".gradient { --tw-gradient-to: oklab(66.584% .082678 .133963/.8); }",
      ".muted { color: #333; color: color-mix(in oklab, #333 50%, transparent); }",
      ".alpha { color: rgb(1 2 3 / 50%); }",
    ].join("\n");

    const out = await makeWebviewCompatibleCss(css);
    expect(out).not.toContain("oklab(");
    expect(out).toContain("rgba(");
    expect(out).toContain("color: #333");
    expect(out).toContain("rgba(1, 2, 3, 50%)");
  });

  it("combines translate, rotate, and scale fallbacks through shared variables", async () => {
    const css = [
      ".move-x { --tw-translate-x: 1rem; translate: var(--tw-translate-x)var(--tw-translate-y); }",
      ".turn { rotate: 90deg; }",
      ".grow { scale: 0.65; }",
    ].join("\n");

    const out = await makeWebviewCompatibleCss(css);
    expect(out).toContain("--ryx-legacy-translate-x: var(--tw-translate-x, 0)");
    expect(out).toContain("--ryx-legacy-rotate: 90deg");
    expect(out).toContain("--ryx-legacy-scale-x: 0.65");
    expect(out).toContain(
      "transform: translate(var(--ryx-legacy-translate-x, 0), var(--ryx-legacy-translate-y, 0)) rotate(var(--ryx-legacy-rotate, 0deg)) scale(var(--ryx-legacy-scale-x, 1), var(--ryx-legacy-scale-y, 1))",
    );
  });

  it("adds viewport-unit and container-query fallbacks", async () => {
    const css = [
      ".sheet { max-height: 82dvh; border-radius: 3.75cqw; }",
      "@container (max-width: 23.99rem) { .seat { width: 32px; } }",
    ].join("\n");

    const out = await makeWebviewCompatibleCss(css);
    expect(out).toContain("max-height: 82vh");
    expect(out).toContain("border-radius: 3.75vw");
    expect(out).toContain("@media (max-width: 23.99rem)");
    expect(out).toContain("@container (max-width: 23.99rem)");
  });
});
