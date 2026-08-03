import { LOGIN_FONT, LOGIN_LAYOUT } from "@/config/login";

/** Shared header, overlay, and agreement tokens. */
export const PASSWORD_LOGIN_SHARED = {
  paddingX: LOGIN_LAYOUT.paddingX,
  headerTop: LOGIN_LAYOUT.headerTop,
  backButton: LOGIN_LAYOUT.backButton,
  headerActions: LOGIN_LAYOUT.headerActions,
  overlay: LOGIN_LAYOUT.overlay,
  agreement: LOGIN_LAYOUT.agreement,
} as const;

/** Layer positions on 750×1624 MasterGo canvas (账号密码登录). */
export const PASSWORD_LOGIN_LAYOUT = {
  title: {
    left: 40,
    top: 239,
    width: 378,
    height: 76,
    fontSize: 54,
    fontWeight: 600,
    color: "#FFFFFF",
    text: "账号密码登录",
  },
  loginModeTabs: {
    left: 40,
    top: 352,
    width: 330,
    height: 58,
  },
  inputClear: {
    size: 28,
  },
  accountInput: {
    left: 40,
    top: 371,
    width: 670,
    fontSize: 32,
    placeholder: "请输入账号",
    placeholderColor: "rgba(255, 255, 255, 0.45)",
  },
  passwordInput: {
    left: 40,
    top: 480,
    width: 670,
    fontSize: 32,
    placeholder: "登录密码",
    placeholderColor: "rgba(255, 255, 255, 0.45)",
    toggleSize: 40,
    actionGap: 16,
  },
  button: {
    left: 40,
    top: 600,
    width: 670,
    height: 84,
    borderRadius: 12,
    fontSize: 32,
    gradient: "linear-gradient(270deg, var(--brand-btn-end) 0%, var(--brand-btn-start) 100%)",
    text: "登录",
  },
  forgotPasswordLink: {
    right: 40,
    top: 740,
    fontSize: 24,
    fontWeight: 400,
    color: "#FFFFFF",
    text: "忘记密码",
  },
  rememberPassword: {
    left: 40,
    top: 740,
    fontSize: 24,
    checkboxSize: 28,
    checkboxCheckedBg: "var(--brand-btn-start)",
    color: "#FFFFFF",
    text: "记住密码",
  },
} as const;

export { LOGIN_FONT };
