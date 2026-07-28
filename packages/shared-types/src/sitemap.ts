import type { HomeBannerLink } from "./home-banner.js";

/** Entry returned by legacy `MmsApiHomeUrl-Sitemap-List`. */
export interface HomeSitemapItem {
  Id?: string | number;
  Title?: string;
  Url?: HomeBannerLink | string;
  Tag?: string;
  SourceUrl?: string;
}
