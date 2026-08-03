import { PINGFANG_FONT } from "@/config/design";

/** Shared login screen tokens (750×1624 MasterGo canvas). */
export const LOGIN_LAYOUT = {
  paddingX: 40,
  headerTop: 108,
  backButton: {
    size: 48,
    iconSize: 44,
  },
  headerActions: {
    top: 108,
    /** Scan icon right inset: 750 - 702 - 28 */
    scanRight: 20,
    gap: 24,
    scanSize: 28,
  },
  overlay: {
    background: "rgba(0, 0, 0, 0.5)",
  },
  agreement: {
    left: 40,
    bottom: 114,
    checkboxSize: 28,
    checkboxCheckedBg: "#FFFFFF",
    checkboxCheckColor: "#0a1628",
    fontSize: 24,
    color: "rgba(255, 255, 255, 0.65)",
    linkColor: "rgba(255, 255, 255, 0.65)",
    text: "阅读并同意",
    linkText: "《用户注册协议及隐私政策》",
  },
} as const;

export const LOGIN_FONT = PINGFANG_FONT;
