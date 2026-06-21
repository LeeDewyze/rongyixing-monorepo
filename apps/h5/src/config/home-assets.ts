/**
 * Home screen static assets exported from Figma (node ids in comments).
 * Source file: pUno5QvNulmKFvvGMDt4Ak — icon sheet `37:5465` + page `10:213`.
 */
import businessApplyIcon from "@/assets/home/business-apply.png";
import businessMyApprovalIcon from "@/assets/home/business-my-approval.png";
import carActiveIcon from "@/assets/home/car-active.png";
import flightActiveIcon from "@/assets/home/flight-active.png";
import flightDefaultIcon from "@/assets/home/flight-default.png";
import heroBanner from "@/assets/home/hero-banner.png";
import hotelActiveIcon from "@/assets/home/hotel-active.png";
import hotelDefaultIcon from "@/assets/home/hotel-default.png";
import tabHomeActiveIcon from "@/assets/home/tab-home-active.svg";
import tabHomeInactiveIcon from "@/assets/home/tab-home-inactive.svg";
import tabOrdersActiveIcon from "@/assets/home/tab-orders-active.svg";
import tabOrdersInactiveIcon from "@/assets/home/tab-orders-inactive.svg";
import tabProfileActiveIcon from "@/assets/home/tab-profile-active.svg";
import tabProfileInactiveIcon from "@/assets/home/tab-profile-inactive.svg";
import trainActiveIcon from "@/assets/home/train-active.png";
import trainDefaultIcon from "@/assets/home/train-default.png";
import travelModeTrack from "@/assets/home/travel-mode-track.png";

export type HomeTravelMode = "business" | "personal";
export type HomeProductId = "flight" | "train" | "hotel";

export const HOME_ASSETS = {
  /** Figma 10:216 — home hero banner (375×208) */
  heroBanner,
  travelMode: {
    /** Figma 10:218 */
    track: travelModeTrack,
  },
  products: {
    flight: {
      /** Figma 38:5832 */
      default: flightDefaultIcon,
      /** Figma 38:5816 */
      active: flightActiveIcon,
    },
    train: {
      /** Figma 38:5828 */
      default: trainDefaultIcon,
      /** Figma 38:5838 */
      active: trainActiveIcon,
    },
    hotel: {
      /** Figma 38:5822 */
      default: hotelDefaultIcon,
      /** Figma 38:5845 */
      active: hotelActiveIcon,
    },
    car: {
      /** Figma 38:5921 — profile 用车 */
      active: carActiveIcon,
    },
  },
  business: {
    /** Figma 38:5854 */
    apply: businessApplyIcon,
    /** Figma 38:5857 */
    myApproval: businessMyApprovalIcon,
    /** Figma 10:326 — same stamp icon as my approval */
    pending: businessMyApprovalIcon,
    done: businessMyApprovalIcon,
  },
  tabBar: {
    home: {
      /** Figma 38:5972 */
      active: tabHomeActiveIcon,
      /** Figma 38:5969 */
      inactive: tabHomeInactiveIcon,
    },
    orders: {
      /** Figma 38:5973 */
      active: tabOrdersActiveIcon,
      /** Figma 38:5970 */
      inactive: tabOrdersInactiveIcon,
    },
    profile: {
      /** Figma 38:5974 */
      active: tabProfileActiveIcon,
      /** Figma 38:5971 */
      inactive: tabProfileInactiveIcon,
    },
  },
} as const;
