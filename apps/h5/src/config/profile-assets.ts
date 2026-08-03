/**
 * Profile screen assets exported from Figma (node `23:2495`).
 */
import defaultAvatar from "@/assets/profile/default-avatar.png";
import orgBuildingIcon from "@/assets/profile/org-building-icon.png";
import personalCenterChevronIcon from "@/assets/profile/personal-center-chevron.png";
import menuBankCardIcon from "@/assets/profile/menu-bank-card.png";
import menuChevronRightIcon from "@/assets/profile/menu-chevron-right.png";
import menuContactIcon from "@/assets/profile/menu-contact.png";
import menuCredentialsIcon from "@/assets/profile/menu-credentials.png";
import menuSettingsIcon from "@/assets/profile/menu-settings.png";

export const PROFILE_ASSETS = {
  /** Figma 23:2495 — default profile avatar (144×144 @2x, display 72px) */
  defaultAvatar,
  /** Figma Frame — organization code building icon (20×20) */
  orgBuilding: orgBuildingIcon,
  /** Figma Vector — personal center button chevron (white) */
  personalCenterChevron: personalCenterChevronIcon,
  menu: {
    /** Figma Group 33 — 证件管理 */
    credentials: menuCredentialsIcon,
    /** Figma Group 34 — 银行卡信息 */
    bankCard: menuBankCardIcon,
    /** Figma Group 35 — 联系我们 */
    contact: menuContactIcon,
    /** Figma Vector — menu row chevron */
    chevronRight: menuChevronRightIcon,
    /** Figma Group 36 — 设置 */
    settings: menuSettingsIcon,
  },
} as const;
