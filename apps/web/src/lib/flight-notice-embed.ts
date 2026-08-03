const MOBILE_VIEWPORT =
  '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">';

const MOBILE_NOTICE_STYLE = `<style id="ryx-flight-notice-mobile">
  html, body {
    overflow-x: hidden !important;
    max-width: 100% !important;
    width: 100% !important;
    box-sizing: border-box;
    overscroll-behavior-x: none;
    touch-action: pan-y;
  }
  body {
    margin: 0;
    padding: 12px;
    -webkit-text-size-adjust: 100%;
  }
  table, img, div, p, span, section {
    max-width: 100% !important;
    box-sizing: border-box;
  }
  table {
    width: 100% !important;
    table-layout: fixed !important;
  }
  img {
    height: auto !important;
  }
</style>`;

/** Decode legacy Word-exported notice pages that may be UTF-16. */
export function decodeNoticeHtmlResponse(buffer: ArrayBuffer): string {
  const view = new Uint8Array(buffer);
  if (view.length >= 2 && view[0] === 0xff && view[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(buffer);
  }
  if (view.length >= 2 && view[0] === 0xfe && view[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(buffer);
  }
  return new TextDecoder("utf-8").decode(buffer);
}

/** Inject mobile viewport, overflow guard, and base href for notice HTML. */
export function prepareFlightNoticeSrcdoc(html: string, pageUrl: string): string {
  const basePath = pageUrl.slice(0, pageUrl.lastIndexOf("/") + 1);
  const baseTag = `<base href="${basePath}">`;

  let result = html;
  if (!/name=["']viewport["']/i.test(result)) {
    if (result.includes("<head>")) {
      result = result.replace("<head>", `<head>${MOBILE_VIEWPORT}`);
    } else {
      result = `${MOBILE_VIEWPORT}${result}`;
    }
  }

  if (result.includes("<head>")) {
    return result.replace("<head>", `<head>${baseTag}${MOBILE_NOTICE_STYLE}`);
  }

  return `<head>${baseTag}${MOBILE_NOTICE_STYLE}</head>${result}`;
}

export async function fetchFlightNoticeSrcdoc(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url);
    if (!response.ok) return undefined;
    const buffer = await response.arrayBuffer();
    const html = decodeNoticeHtmlResponse(buffer);
    return prepareFlightNoticeSrcdoc(html, url);
  } catch {
    return undefined;
  }
}
