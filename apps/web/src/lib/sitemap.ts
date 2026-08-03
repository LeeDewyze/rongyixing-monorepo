import { SITE } from "@/config/site";

/** Placeholder sitemap generator for future build integration. */
export function getSitemapEntries(): Array<{ url: string; lastModified: string }> {
  return [
    {
      url: "/",
      lastModified: new Date().toISOString(),
    },
  ];
}

export function getSiteName(): string {
  return SITE.name;
}
