import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import passwordBg from "@/assets/login/password-bg.jpg";
import { LegalDocumentSheet } from "@/components/contact/LegalDocumentSheet";
import { DesignScreen } from "@/components/DesignScreen";
import { PageToast } from "@/components/layout/PageToast";
import { designCqw, designHeightPercent, designWidthPercent } from "@/config/design";
import { LOGIN_FONT, PASSWORD_LOGIN_LAYOUT, PASSWORD_LOGIN_SHARED } from "@/config/password-login";
import { useMobileLogin, usePasswordLogin, useSendLoginCode } from "@/hooks/useAuth";
import { resolveInternalReturnTo } from "@/lib/base-path";
import {
  contactUrlOptionsFromApiConfig,
  getPrivacyPolicyUrl,
  getUserAgreementUrl,
} from "@/lib/contact-us";
import { getApiMode } from "@/lib/env";
import {
  clearRememberedCredentials,
  loadRememberedCredentials,
  saveRememberedCredentials,
} from "@/lib/remember-credentials";

const { overlay, agreement } = PASSWORD_LOGIN_SHARED;

type LoginMode = "password" | "sms";
type LegalDoc = "agreement" | "privacy" | null;
type ToastState = { message: string; tone: "success" | "error" } | null;
const FORM_OFFSET = 72;
const TOAST_DURATION_MS = 2500;

const {
  title,
  loginModeTabs,
  accountInput,
  passwordInput,
  button,
  forgotPasswordLink,
  rememberPassword: rememberPasswordRow,
  inputClear,
} = PASSWORD_LOGIN_LAYOUT;

function getInitialFormState() {
  const remembered = loadRememberedCredentials();
  return {
    account: remembered?.account ?? "",
    password: remembered?.password ?? "",
    rememberChecked: remembered !== null,
  };
}

function InputClearButton({ onClear, size }: { onClear: () => void; size: number }) {
  return (
    <button
      type="button"
      aria-label="Clear input"
      className="flex shrink-0 items-center justify-center rounded-full border-none bg-white/25 p-0 text-white"
      style={{ width: designCqw(size), height: designCqw(size) }}
      onClick={onClear}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden style={{ width: "55%", height: "55%" }}>
        <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function PasswordVisibilityToggle({
  visible,
  onToggle,
  size,
}: {
  visible: boolean;
  onToggle: () => void;
  size: number;
}) {
  const iconStyle = { width: "92%", height: "92%", display: "block" as const };
  const stroke = {
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const eyePath = "M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z";

  return (
    <button
      type="button"
      aria-label={visible ? "Hide password" : "Show password"}
      className="flex shrink-0 items-center justify-center overflow-visible border-none bg-transparent p-0 text-white"
      style={{ width: designCqw(size), height: designCqw(size) }}
      onClick={onToggle}
    >
      {visible ? (
        <svg viewBox="-2 -2 28 28" fill="none" overflow="visible" aria-hidden style={iconStyle}>
          <path d={eyePath} {...stroke} />
          <circle cx="12" cy="12" r="2.5" {...stroke} />
        </svg>
      ) : (
        <svg viewBox="-2 -2 28 28" fill="none" overflow="visible" aria-hidden style={iconStyle}>
          <path d={eyePath} {...stroke} />
          <path d="M4 4l16 16" {...stroke} />
        </svg>
      )}
    </button>
  );
}

export function PasswordLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const login = usePasswordLogin();
  const mobileLogin = useMobileLogin();
  const sendCode = useSendLoginCode();
  const initialForm = getInitialFormState();
  const [loginMode, setLoginMode] = useState<LoginMode>("password");
  const [account, setAccount] = useState(initialForm.account);
  const [password, setPassword] = useState(initialForm.password);
  const [mobile, setMobile] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberChecked, setRememberChecked] = useState(initialForm.rememberChecked);
  const [agreed, setAgreed] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const [legalDoc, setLegalDoc] = useState<LegalDoc>(null);

  function showToast(message: string, tone: "success" | "error" = "error") {
    setToast({ message, tone });
  }

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const legalOptions = contactUrlOptionsFromApiConfig();
  const legalTitle =
    legalDoc === "agreement" ? "融易行用户协议" : legalDoc === "privacy" ? "隐私政策" : "";
  const legalUrl =
    legalDoc === "agreement"
      ? getUserAgreementUrl(legalOptions)
      : legalDoc === "privacy"
        ? getPrivacyPolicyUrl(legalOptions)
        : "";

  function navigateAfterLogin() {
    navigate(resolveInternalReturnTo(returnTo, "/home"), { replace: true });
  }

  async function handleLogin() {
    if (login.isPending || mobileLogin.isPending) return;
    if (loginMode === "sms") {
      await handleSmsLogin();
      return;
    }

    if (!account.trim()) {
      showToast("请输入账号");
      return;
    }
    if (!password) {
      showToast("请输入密码");
      return;
    }
    if (!agreed) {
      showToast("请先阅读并同意用户协议");
      return;
    }

    setToast(null);
    try {
      await login.mutateAsync({ Name: account.trim(), Password: password });
      if (rememberChecked) {
        saveRememberedCredentials(account.trim(), password);
      } else {
        clearRememberedCredentials();
      }
      navigateAfterLogin();
    } catch {
      // Error surfaced via login.error
    }
  }

  async function handleSendCode() {
    if (sendCode.isPending || countdown > 0) return;
    const trimmedMobile = mobile.trim();
    if (!trimmedMobile) {
      showToast("请输入手机号");
      return;
    }
    if (!/^1\d{10}$/.test(trimmedMobile)) {
      showToast("请输入正确的手机号");
      return;
    }

    setToast(null);
    try {
      await sendCode.mutateAsync(trimmedMobile);
      setCodeSent(true);
      setSmsCode("");
      setCountdown(60);
      showToast("验证码已发送", "success");
    } catch {
      // Error surfaced via sendCode.error
    }
  }

  async function handleSmsLogin() {
    if (!mobile.trim()) {
      showToast("请输入手机号");
      return;
    }
    if (!/^1\d{10}$/.test(mobile.trim())) {
      showToast("请输入正确的手机号");
      return;
    }
    if (!smsCode.trim()) {
      showToast("请输入验证码");
      return;
    }
    if (!agreed) {
      showToast("请先阅读并同意用户协议");
      return;
    }

    setToast(null);
    try {
      await mobileLogin.mutateAsync({ Mobile: mobile.trim(), Code: smsCode.trim() });
      navigateAfterLogin();
    } catch {
      // Error surfaced via mobileLogin.error
    }
  }

  function openLegalDoc(doc: Exclude<LegalDoc, null>) {
    setLegalDoc(doc);
  }

  const pending = login.isPending || mobileLogin.isPending;
  const authError = loginMode === "password" ? login.error : mobileLogin.error || sendCode.error;
  const canSubmit =
    agreed &&
    (loginMode === "password"
      ? account.trim().length > 0 && password.length > 0
      : mobile.trim().length > 0 && smsCode.trim().length > 0);
  const apiMode = import.meta.env.DEV ? getApiMode() : null;

  useEffect(() => {
    if (!authError) return;
    showToast(authError instanceof Error ? authError.message : "登录失败");
  }, [authError]);

  return (
    <DesignScreen>
      <img
        src={passwordBg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-bottom"
        aria-hidden
      />
      <div className="absolute inset-0" style={{ background: overlay.background }} aria-hidden />

      <div className="relative z-10 h-full w-full" style={{ fontFamily: LOGIN_FONT }}>
        <h1
          className="absolute m-0"
          style={{
            left: designWidthPercent(title.left),
            top: designHeightPercent(title.top),
            width: designWidthPercent(title.width),
            minHeight: designHeightPercent(title.height),
            fontSize: designCqw(title.fontSize),
            fontWeight: title.fontWeight,
            lineHeight: "normal",
            letterSpacing: 0,
            color: title.color,
          }}
        >
          {loginMode === "password" ? title.text : "短信验证码登录"}
        </h1>

        <div
          className="absolute flex rounded-full bg-white/15 p-1"
          style={{
            left: designWidthPercent(loginModeTabs.left),
            top: designHeightPercent(loginModeTabs.top),
            width: designWidthPercent(loginModeTabs.width),
            height: designCqw(loginModeTabs.height),
            backdropFilter: "blur(10px)",
          }}
        >
          {(["password", "sms"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className="flex flex-1 items-center justify-center rounded-full border-none p-0"
              style={{
                background: loginMode === mode ? "rgba(255,255,255,0.92)" : "transparent",
                color: loginMode === mode ? "var(--brand-primary)" : "rgba(255,255,255,0.72)",
                fontSize: designCqw(24),
                fontWeight: loginMode === mode ? 600 : 400,
              }}
              onClick={() => {
                setLoginMode(mode);
                setToast(null);
              }}
            >
              {mode === "password" ? "账号登录" : "短信登录"}
            </button>
          ))}
        </div>

        <div
          className="absolute border-b border-white/90"
          style={{
            left: designWidthPercent(accountInput.left),
            top: designHeightPercent(accountInput.top + FORM_OFFSET),
            width: designWidthPercent(accountInput.width),
            paddingBottom: designCqw(20),
          }}
        >
          <div className="flex items-center" style={{ gap: designCqw(12) }}>
            <input
              type="text"
              autoComplete={loginMode === "password" ? "username" : "tel"}
              inputMode={loginMode === "password" ? "text" : "tel"}
              placeholder={loginMode === "password" ? accountInput.placeholder : "请输入手机号"}
              value={loginMode === "password" ? account : mobile}
              onChange={(e) =>
                loginMode === "password" ? setAccount(e.target.value) : setMobile(e.target.value)
              }
              className="min-w-0 flex-1 border-none bg-transparent p-0 text-white outline-none"
              style={{ fontSize: designCqw(accountInput.fontSize), caretColor: "#33a1f9" }}
            />
            {(loginMode === "password" ? account : mobile) ? (
              <InputClearButton
                onClear={() => (loginMode === "password" ? setAccount("") : setMobile(""))}
                size={inputClear.size}
              />
            ) : null}
          </div>
        </div>

        <div
          className="absolute border-b border-white/90"
          style={{
            left: designWidthPercent(passwordInput.left),
            top: designHeightPercent(passwordInput.top + FORM_OFFSET),
            width: designWidthPercent(passwordInput.width),
            paddingBottom: designCqw(20),
          }}
        >
          <div className="flex min-w-0 items-center">
            <input
              type={loginMode === "password" && !showPassword ? "password" : "text"}
              autoComplete={loginMode === "password" ? "current-password" : "one-time-code"}
              inputMode={loginMode === "password" ? "text" : "numeric"}
              placeholder={loginMode === "password" ? passwordInput.placeholder : "请输入验证码"}
              value={loginMode === "password" ? password : smsCode}
              onChange={(e) =>
                loginMode === "password" ? setPassword(e.target.value) : setSmsCode(e.target.value)
              }
              className="min-w-0 flex-1 border-none bg-transparent p-0 text-white outline-none"
              style={{ fontSize: designCqw(passwordInput.fontSize), caretColor: "#33a1f9" }}
            />
            <div
              className="relative z-10 flex shrink-0 items-center"
              style={{ gap: designCqw(passwordInput.actionGap), marginLeft: designCqw(8) }}
            >
              {(loginMode === "password" ? password : smsCode) ? (
                <InputClearButton
                  onClear={() => (loginMode === "password" ? setPassword("") : setSmsCode(""))}
                  size={inputClear.size}
                />
              ) : null}
              {loginMode === "password" ? (
                <PasswordVisibilityToggle
                  visible={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                  size={passwordInput.toggleSize}
                />
              ) : (
                <button
                  type="button"
                  className="rounded-full border-none bg-white/15 px-2 py-1 text-white disabled:opacity-55"
                  style={{ fontSize: designCqw(22) }}
                  disabled={sendCode.isPending || countdown > 0}
                  onClick={() => void handleSendCode()}
                >
                  {countdown > 0
                    ? `${countdown}s`
                    : sendCode.isPending
                      ? "发送中"
                      : codeSent
                        ? "重发"
                        : "获取验证码"}
                </button>
              )}
            </div>
          </div>
        </div>

        <style>{`
          input::placeholder {
            color: ${accountInput.placeholderColor};
            font-size: ${designCqw(accountInput.fontSize)};
          }
        `}</style>

        {import.meta.env.DEV && apiMode === "mock" ? (
          <p
            className="absolute text-white/50"
            style={{
              left: designWidthPercent(button.left),
              top: `calc(${designHeightPercent(button.top + FORM_OFFSET)} - ${designCqw(36)})`,
              fontSize: designCqw(22),
            }}
          >
            开发 Mock 模式：不会发起网络请求
          </p>
        ) : null}

        <button
          type="button"
          className="absolute flex items-center justify-center border-none text-white"
          style={{
            left: designWidthPercent(button.left),
            top: designHeightPercent(button.top + FORM_OFFSET),
            width: designWidthPercent(button.width),
            height: designCqw(button.height),
            borderRadius: designCqw(button.borderRadius),
            background: button.gradient,
            fontSize: designCqw(button.fontSize),
            fontWeight: 500,
            opacity: pending ? 0.7 : canSubmit ? 1 : 0.55,
          }}
          disabled={pending}
          onClick={() => void handleLogin()}
        >
          {pending ? "登录中…" : button.text}
        </button>

        {loginMode === "password" ? (
          <label
            className="absolute flex cursor-pointer items-center"
            style={{
              left: designWidthPercent(rememberPasswordRow.left),
              top: designHeightPercent(rememberPasswordRow.top + FORM_OFFSET),
              gap: designCqw(12),
              fontSize: designCqw(rememberPasswordRow.fontSize),
              color: rememberPasswordRow.color,
              lineHeight: "normal",
            }}
          >
            <input
              type="checkbox"
              checked={rememberChecked}
              onChange={(e) => {
                const checked = e.target.checked;
                setRememberChecked(checked);
                if (!checked) {
                  clearRememberedCredentials();
                }
              }}
              className="login-remember-checkbox shrink-0 appearance-none rounded-full border border-white/70 bg-transparent"
              style={{
                width: designCqw(rememberPasswordRow.checkboxSize),
                height: designCqw(rememberPasswordRow.checkboxSize),
              }}
            />
            <span className="whitespace-nowrap">{rememberPasswordRow.text}</span>
          </label>
        ) : null}

        {loginMode === "password" ? (
          <Link
            to="/login/forgot-password"
            className="absolute no-underline"
            style={{
              right: designWidthPercent(forgotPasswordLink.right),
              top: designHeightPercent(forgotPasswordLink.top + FORM_OFFSET),
              fontSize: designCqw(forgotPasswordLink.fontSize),
              fontWeight: forgotPasswordLink.fontWeight,
              lineHeight: "normal",
              letterSpacing: 0,
              color: forgotPasswordLink.color,
            }}
          >
            {forgotPasswordLink.text}
          </Link>
        ) : null}

        <style>{`
          .login-remember-checkbox:checked {
            border-color: ${rememberPasswordRow.checkboxCheckedBg};
            background-color: ${rememberPasswordRow.checkboxCheckedBg};
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 10' fill='none'%3E%3Cpath d='M1 5.2 4.4 8.6 11 1.4' stroke='%23ffffff' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
            background-size: 58% 58%;
            background-position: center;
            background-repeat: no-repeat;
          }
        `}</style>

        <div
          className="absolute flex cursor-pointer items-center"
          role="checkbox"
          aria-checked={agreed}
          tabIndex={0}
          style={{
            left: designWidthPercent(agreement.left),
            bottom: designHeightPercent(agreement.bottom),
            gap: designCqw(12),
            fontSize: designCqw(agreement.fontSize),
            color: agreement.color,
            lineHeight: 1.4,
          }}
          onClick={() => {
            setAgreed((value) => {
              const next = !value;
              if (next) setToast(null);
              return next;
            });
          }}
          onKeyDown={(event) => {
            if (event.key !== " " && event.key !== "Enter") return;
            event.preventDefault();
            setAgreed((value) => {
              const next = !value;
              if (next) setToast(null);
              return next;
            });
          }}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked);
              if (e.target.checked) setToast(null);
            }}
            onClick={(event) => event.stopPropagation()}
            className="login-agreement-checkbox shrink-0 appearance-none rounded-full border border-white/70 bg-transparent"
            style={{
              width: designCqw(agreement.checkboxSize),
              height: designCqw(agreement.checkboxSize),
            }}
          />
          <style>{`
            .login-agreement-checkbox:checked {
              border-color: ${agreement.checkboxCheckedBg};
              background-color: ${agreement.checkboxCheckedBg};
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 10' fill='none'%3E%3Cpath d='M1 5.2 4.4 8.6 11 1.4' stroke='%230a1628' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
              background-size: 58% 58%;
              background-position: center;
              background-repeat: no-repeat;
            }
          `}</style>
          <span className="whitespace-nowrap">
            {agreement.text}
            <button
              type="button"
              className="border-none bg-transparent p-0"
              style={{ color: agreement.linkColor, font: "inherit" }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                openLegalDoc("agreement");
              }}
            >
              用户协议
            </button>
            和
            <button
              type="button"
              className="border-none bg-transparent p-0"
              style={{ color: agreement.linkColor, font: "inherit" }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                openLegalDoc("privacy");
              }}
            >
              隐私政策
            </button>
          </span>
        </div>

        <LegalDocumentSheet
          open={legalDoc !== null}
          title={legalTitle}
          url={legalUrl}
          onClose={() => setLegalDoc(null)}
        />
      </div>

      <PageToast message={toast?.message ?? null} tone={toast?.tone} placement="center" />
    </DesignScreen>
  );
}
