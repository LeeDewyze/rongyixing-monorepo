import type { HomeBanner } from "@ryx/shared-types";

export const MOCK_HOME_BANNERS: HomeBanner[] = [
  {
    Id: "banner-hotel",
    Title: "酒店促销",
    Tag: "优惠",
    ImageUrl:
      "http://image48.rtesp.com/files/images/2022/04/07/10/00/40/24489a6ab8ca475799509b133823caf3_img9.png",
    Url: {
      path: "tmc-hotel-search",
      tag: "TmcHotel",
    },
  },
  {
    Id: "banner-flight",
    Title: "机票推荐",
    ImageUrl:
      "http://image79.rtesp.com/files/images/2021/12/10/16/30/21/f5873c9f6bd14659ae8dbface5c5c3fd_img22.png",
    Url: {
      path: "tmc-flight-search_ryx",
      tag: "TmcFlight",
    },
  },
  {
    Id: "banner-external",
    Title: "活动页",
    ImageUrl:
      "http://image59.rtesp.com/files/images/2021/12/10/16/31/50/f63904aaaec9480cbff637cf4145c9f1_img80.png",
    Url: {
      url: "https://example.com/promo",
      isOpenInAppBrowser: false,
    },
  },
  {
    Id: "banner-check",
    Title: "需校验活动",
    ImageUrl:
      "http://image24.rtesp.com/files/images/2021/12/10/16/31/15/de1216c0c90e4b49ac422c9f98b84d58_img42.png",
    Url: {
      path: "tmc-train-search",
      checkUrl: "https://check.example.com/verify",
      tag: "TmcTrain",
    },
  },
];
