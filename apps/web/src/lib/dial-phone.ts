interface NativeCallPlugin {
  callNumber: (phone: string, bypassAppChooser?: boolean) => Promise<unknown>;
}

type WindowWithCall = Window & { call?: NativeCallPlugin };

export interface DialPhoneHost {
  userAgent: string;
  nativeCall?: NativeCallPlugin;
  openTelInIframe: (url: string) => void;
  clickTelAnchor: (url: string) => void;
}

export function buildTelUrl(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";
  return /^tel:/i.test(trimmed) ? `tel:${trimmed.slice(trimmed.indexOf(":") + 1)}` : `tel:${trimmed}`;
}

function readNativeDialer(): NativeCallPlugin | undefined {
  if (typeof window === "undefined") return undefined;
  const plugin = (window as WindowWithCall).call;
  return plugin && typeof plugin.callNumber === "function" ? plugin : undefined;
}

function createBrowserHost(): DialPhoneHost {
  return {
    userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent,
    nativeCall: readNativeDialer(),
    openTelInIframe(url) {
      const iframe = document.createElement("iframe");
      iframe.src = url;
      iframe.setAttribute("aria-hidden", "true");
      iframe.style.cssText = "display:none;width:0;height:0;border:0";
      document.body.appendChild(iframe);
      window.setTimeout(() => iframe.remove(), 1000);
    },
    clickTelAnchor(url) {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    },
  };
}

function isAndroidUserAgent(userAgent: string): boolean {
  return /Android/i.test(userAgent);
}

/** Dial without navigating the current WebView (some Android shells fail on in-page tel: links). */
export function dialPhone(phone: string, host: DialPhoneHost = createBrowserHost()): boolean {
  const url = buildTelUrl(phone);
  if (!url) return false;

  const number = url.slice("tel:".length);
  if (host.nativeCall) {
    void host.nativeCall.callNumber(number, true);
    return true;
  }

  if (isAndroidUserAgent(host.userAgent)) {
    host.openTelInIframe(url);
    return true;
  }

  host.clickTelAnchor(url);
  return true;
}
