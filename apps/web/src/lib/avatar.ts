const AVATAR_CACHE_KEY = "ryx_avatar_cache_buster";

function isSafeUrl(url: string): boolean {
  return /^data:|^blob:|^javascript:/i.test(url);
}

export function getAvatarCacheBuster(): string {
  try {
    return localStorage.getItem(AVATAR_CACHE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function bumpAvatarCacheBuster(value = String(Date.now())): string {
  try {
    localStorage.setItem(AVATAR_CACHE_KEY, value);
  } catch {
    // ignore storage errors
  }
  return value;
}

export function withAvatarCacheBuster(url?: string | null, cacheBuster = getAvatarCacheBuster()): string {
  if (!url) return "";
  if (isSafeUrl(url)) return url;
  if (!cacheBuster) return url;

  try {
    const resolved = new URL(url, window.location.origin);
    resolved.searchParams.set("v", cacheBuster);
    return resolved.toString();
  } catch {
    const [path, query = ""] = url.split("?");
    const params = new URLSearchParams(query);
    params.set("v", cacheBuster);
    const nextQuery = params.toString();
    return nextQuery ? `${path}?${nextQuery}` : path;
  }
}
