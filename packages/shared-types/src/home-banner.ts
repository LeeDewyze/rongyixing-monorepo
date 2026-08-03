/** Banner link payload from `TmcApiHomeUrl-Banner-List` (same shape as workbench Url). */
export interface HomeBannerLink {
  url?: string;
  path?: string;
  tag?: string;
  checkUrl?: string;
  title?: string;
  isBlank?: boolean;
  isOpenInAppBrowser?: boolean;
  wechatMiniAppId?: string;
  wechatMiniPath?: string;
}

export interface HomeBanner {
  Id?: string | number;
  Title?: string;
  Name?: string;
  ImageUrl?: string;
  Url?: HomeBannerLink | string;
  Tag?: string;
}

/** Target passed to legacy onJump / coreJump. */
export interface LegacyJumpTarget {
  Url?: HomeBannerLink | string;
  Name?: string;
  Title?: string;
}
