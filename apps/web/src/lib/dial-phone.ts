import { showAppAlertDialog } from "@/lib/app-confirm-dialog";

export interface DialPhoneHost {
  userAgent: string;
  copyText: (text: string) => Promise<boolean>;
  notifyCopied: (phone: string) => void;
}

export function buildTelUrl(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";
  return /^tel:/i.test(trimmed) ? `tel:${trimmed.slice(trimmed.indexOf(":") + 1)}` : `tel:${trimmed}`;
}

async function copyTextWithBrowser(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy textarea copy path for old Android WebViews.
    }
  }

  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "readonly");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

function createBrowserHost(): DialPhoneHost {
  return {
    userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent,
    copyText: copyTextWithBrowser,
    notifyCopied(phone) {
      void showAppAlertDialog(`电话号码已复制：${phone}`);
    },
  };
}

/** Copy-only phone action for H5 shells where native/tel dialing is unreliable. */
export function dialPhone(phone: string, host: DialPhoneHost = createBrowserHost()): boolean {
  const url = buildTelUrl(phone);
  if (!url) return false;

  const number = url.slice("tel:".length);
  void host.copyText(number).then((copied) => {
    if (copied) {
      host.notifyCopied(number);
    }
  });
  return true;
}
