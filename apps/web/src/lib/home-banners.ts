import type { HomeBanner } from "@ryx/shared-types";

import {
  isPersonalPushMessageEnabled,
  PERSONAL_PUSH_FILTER_TAGS,
} from "@/lib/message-notification-settings";

export interface HomeBannerSlide {
  id: string;
  imageUrl: string;
  banner?: HomeBanner;
}

/** Prefer HTTPS for remote banner assets when the page is served over HTTPS. */
export function normalizeBannerImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    trimmed.startsWith("http://")
  ) {
    return `https://${trimmed.slice("http://".length)}`;
  }

  return trimmed;
}

function matchesPersonalFilterTag(value: string | undefined): boolean {
  if (!value) return false;
  return PERSONAL_PUSH_FILTER_TAGS.some((tag) => value.includes(tag));
}

/** Legacy `getFilteredBanners` — client-side filter when personalized push is off. */
export function filterPersonalizedBanners(banners: HomeBanner[]): HomeBanner[] {
  if (isPersonalPushMessageEnabled()) return banners;
  return banners.filter((banner) => {
    const blob = `${banner.Tag ?? ""}${banner.Title ?? ""}${banner.Name ?? ""}`;
    return !matchesPersonalFilterTag(blob);
  });
}

export function resolveBannerSlides(banners: HomeBanner[]): HomeBannerSlide[] {
  return banners
    .filter((banner) => Boolean(banner.ImageUrl?.trim()))
    .map((banner, index) => ({
      id: String(banner.Id ?? index),
      imageUrl: normalizeBannerImageUrl(banner.ImageUrl!),
      banner,
    }));
}
