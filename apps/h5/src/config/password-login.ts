import { LOGIN_FONT, LOGIN_LAYOUT } from "@/config/login";

/** Shared header, overlay, and agreement from phone login. */
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
  accountInput: {
    left: 40,
    top: 339,
    width: 670,
    fontSize: 32,
    placeholder: "请输入账号",
    placeholderColor: "rgba(255, 255, 255, 0.45)",
  },
  passwordInput: {
    left: 40,
    top: 448,
    width: 670,
    fontSize: 32,
    placeholder: "登录密码",
    placeholderColor: "rgba(255, 255, 255, 0.45)",
    toggleSize: 40,
  },
  button: {
    left: 40,
    top: 568,
    width: 670,
    height: 84,
    borderRadius: 12,
    fontSize: 32,
    gradient: "linear-gradient(270deg, #2768fa 0%, #33a1f9 100%)",
    text: "登录",
  },
  phoneCodeLink: {
    left: 40,
    top: 708,
    fontSize: 24,
    fontWeight: 400,
    color: "#FFFFFF",
    text: "手机验证码登录",
  },
  forgotPasswordLink: {
    right: 40,
    top: 708,
    fontSize: 24,
    fontWeight: 400,
    color: "#FFFFFF",
    text: "忘记密码",
  },
} as const;

export { LOGIN_FONT };
