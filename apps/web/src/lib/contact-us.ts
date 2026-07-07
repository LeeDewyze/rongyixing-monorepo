import type { TmcData } from "@ryx/shared-types";

import { getDomain } from "@/lib/domain";
import { getApi } from "@/lib/api";

/** Legacy `CONFIG.contactus.phone` fallback. */
export const DEFAULT_CONTACT_PHONE = "010-89630300";

export interface ContactUrlOptions {
  /** H5 improvement: override from `/Home/Setting` when available. */
  mobileHomeUrl?: string;
  clientAppUrl?: string;
  /** Legacy-aligned base host suffix, e.g. `rtesp.com`. */
  legacyAppDomain?: string;
  /** Env app base, e.g. `http://app.rtesp.com`. */
  envAppBaseUrl?: string;
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Resolve configured app base — never empty dev proxy base for external links. */
export function resolveEnvAppBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) {
    return trimTrailingSlash(configured);
  }
  return "https://app.rongtrip.cn";
}

/**
 * Legacy `CONFIG.appDomain` equivalent — host suffix for `app.{domain}` / `m.{domain}`.
 * Derives from `VITE_API_BASE_URL` when possible (`app.rtesp.com` → `rtesp.com`).
 */
export function getLegacyAppDomain(options?: Pick<ContactUrlOptions, "envAppBaseUrl">): string {
  const envBase = options?.envAppBaseUrl ?? resolveEnvAppBaseUrl();
  try {
    const hostname = new URL(envBase).hostname;
    if (hostname.startsWith("app.")) {
      return hostname.slice("app.".length);
    }
    return hostname;
  } catch {
    return getDomain();
  }
}

function legacyAppPortalBaseUrl(domain: string, envBase: string): string {
  try {
    const { protocol } = new URL(envBase);
    return `${protocol}//app.${domain}`;
  } catch {
    return `http://app.${domain}`;
  }
}

function legacyMobileHomeBaseUrl(domain: string, envBase: string): string {
  try {
    const { protocol } = new URL(envBase);
    return `${protocol}//m.${domain}`;
  } catch {
    return `http://m.${domain}`;
  }
}

/** Legal doc host — legacy `CONFIG.getApiUrl()`. H5 may override via `ClientAppUrl`. */
export function getAppPortalBaseUrl(options: ContactUrlOptions = {}): string {
  if (options.clientAppUrl?.trim()) {
    return trimTrailingSlash(options.clientAppUrl.trim());
  }
  const domain = options.legacyAppDomain ?? getLegacyAppDomain(options);
  const envBase = options.envAppBaseUrl ?? resolveEnvAppBaseUrl();
  return legacyAppPortalBaseUrl(domain, envBase);
}

/** Contact iframe host — legacy `http://m.${domain}/Home/ContactUs`. */
export function getContactUsIframeUrl(options: ContactUrlOptions = {}): string {
  if (options.mobileHomeUrl?.trim()) {
    return `${trimTrailingSlash(options.mobileHomeUrl.trim())}/Home/ContactUs`;
  }
  const domain = options.legacyAppDomain ?? getLegacyAppDomain(options);
  const envBase = options.envAppBaseUrl ?? resolveEnvAppBaseUrl();
  return `${legacyMobileHomeBaseUrl(domain, envBase)}/Home/ContactUs`;
}

export function getUserAgreementUrl(options: ContactUrlOptions = {}): string {
  return `${getAppPortalBaseUrl(options)}/ryxuseragreement.html`;
}

export function getPrivacyPolicyUrl(options: ContactUrlOptions = {}): string {
  return `${getAppPortalBaseUrl(options)}/privacy/ryx/privacy.html`;
}

/** Build URL options from loaded ApiConfig (H5 improvement over legacy hardcoded domain). */
export function contactUrlOptionsFromApiConfig(): ContactUrlOptions {
  const config = getApi().proxy.getApiConfig();
  return {
    mobileHomeUrl: config?.Urls?.MobileHomeUrl,
    clientAppUrl: config?.Urls?.ClientAppUrl,
  };
}

/** Legacy phone resolution: static config phone/mobile, then API `Telephone`. */
export function resolveContactPhone(
  staticPhone = DEFAULT_CONTACT_PHONE,
  staticMobile = "",
  tmcData?: TmcData | null,
): string {
  const fromConfig = staticPhone.trim() || staticMobile.trim();
  if (fromConfig) {
    return fromConfig;
  }
  return tmcData?.Telephone?.trim() ?? "";
}

export function dialContactPhone(phone: string): void {
  if (!phone.trim()) {
    window.alert("请联系贵公司客服！");
    return;
  }
  window.location.href = `tel:${phone.trim()}`;
}
