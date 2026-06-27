import type { FlightFareRuleSheetRow } from "@/lib/flight-detail";

const EXPLAIN_SECTION_HEADERS = new Set([
  "退票费",
  "改期费",
  "托运行李额",
  "手提行李额",
  "附加信息",
  "签转条件",
]);

const FEE_LINE_PATTERN = /^(.+?(?:前|后))\s+(￥\S+)$/;

function isFeeSection(title: string): boolean {
  return title === "退票费" || title === "改期费";
}

/** Parse legacy ticket `Explain` newline text into fare-rule sheet rows. */
export function parseFlightOrderExplain(explain?: string): FlightFareRuleSheetRow[] | null {
  const text = explain?.trim();
  if (!text) return null;

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const hasStructuredHeaders = lines.some((line) => EXPLAIN_SECTION_HEADERS.has(line));
  if (!hasStructuredHeaders) return null;

  const sections: FlightFareRuleSheetRow[] = [];
  let current: FlightFareRuleSheetRow | null = null;
  const descriptionLines: string[] = [];
  const details: Array<{ name: string; value: string }> = [];

  function flushSection() {
    if (!current) return;
    if (descriptionLines.length > 0) {
      current.Description = descriptionLines.join("\n");
    }
    if (details.length > 0) {
      current.Details = [...details];
    }
    sections.push(current);
    current = null;
    descriptionLines.length = 0;
    details.length = 0;
  }

  for (const line of lines) {
    if (EXPLAIN_SECTION_HEADERS.has(line)) {
      flushSection();
      current = { Name: line };
      continue;
    }
    if (!current) continue;

    const sectionTitle = current.Name?.trim() ?? "";
    if (isFeeSection(sectionTitle)) {
      const match = line.match(FEE_LINE_PATTERN);
      if (match) {
        details.push({ name: match[1], value: match[2] });
        continue;
      }
    }
    descriptionLines.push(line);
  }

  flushSection();
  return sections.length > 0 ? sections : null;
}
