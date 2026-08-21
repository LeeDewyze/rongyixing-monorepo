import { describe, expect, it } from "vitest";

import { stripCascadeLayers } from "../../../../tooling/vite/ryx-webview-compat";

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
});
