import { PINGFANG_FONT } from "@/config/design";

/** Layer positions on 750×1624 MasterGo canvas. */
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
  title: {
    left: 40,
    top: 239,
    width: 378,
    height: 76,
    fontSize: 54,
    fontWeight: 600,
    color: "#FFFFFF",
    text: "手机验证码登录",
  },
  subtitle: {
    left: 40,
    top: 339,
    width: 336,
    height: 34,
    fontSize: 24,
    fontWeight: 400,
    color: "#FFFFFF",
    text: "未注册手机验证后即可完成注册",
  },
  phoneInput: {
    left: 40,
    top: 448,
    width: 670,
    fontSize: 32,
    placeholderColor: "rgba(255, 255, 255, 0.45)",
    countryCode: {
      width: 52,
      height: 34,
      fontSize: 24,
      fontWeight: 400,
      color: "#FFFFFF",
    },
    countryChevron: {
      gap: 8,
      width: 10,
      /** Source asset 路径.png intrinsic size (18×10). */
      intrinsicWidth: 18,
      intrinsicHeight: 10,
    },
  },
  button: {
    left: 40,
    top: 568,
    width: 670,
    height: 84,
    borderRadius: 12,
    fontSize: 32,
    gradient: "linear-gradient(270deg, #2768fa 0%, #33a1f9 100%)",
    text: "获取验证码",
  },
  passwordLink: {
    left: 40,
    top: 708,
    fontSize: 24,
    fontWeight: 400,
    color: "#FFFFFF",
    text: "账号密码登录",
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
