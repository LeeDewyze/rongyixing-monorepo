import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import passwordBg from "@/assets/login/password-bg.png";
import { DesignScreen } from "@/components/DesignScreen";
import { designCqw, designHeightPercent, designWidthPercent } from "@/config/design";
import { LOGIN_FONT, PASSWORD_LOGIN_LAYOUT, PASSWORD_LOGIN_SHARED } from "@/config/password-login";
import { usePasswordLogin } from "@/hooks/useAuth";
import { getApiMode } from "@/lib/env";
import {
  clearRememberedCredentials,
  loadRememberedCredentials,
  saveRememberedCredentials,
} from "@/lib/remember-credentials";

const { overlay, agreement } = PASSWORD_LOGIN_SHARED;

const {
  title,
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
  const initialForm = getInitialFormState();
  const [account, setAccount] = useState(initialForm.account);
  const [password, setPassword] = useState(initialForm.password);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberChecked, setRememberChecked] = useState(initialForm.rememberChecked);
  const [agreed, setAgreed] = useState(true);
  const [formHint, setFormHint] = useState<string | null>(null);

  async function handleLogin() {
    if (login.isPending) return;

    if (!account.trim()) {
      setFormHint("请输入账号");
      return;
    }
    if (!password) {
      setFormHint("请输入密码");
      return;
    }
    if (!agreed) {
      setFormHint("请先阅读并同意用户协议");
      return;
    }

    setFormHint(null);
    try {
      await login.mutateAsync({ Name: account.trim(), Password: password });
      if (rememberChecked) {
        saveRememberedCredentials(account.trim(), password);
      } else {
        clearRememberedCredentials();
      }
      navigate(returnTo?.startsWith("/") ? returnTo : "/home");
    } catch {
      // Error surfaced via login.error
    }
  }

  const canSubmit = agreed && account.trim().length > 0 && password.length > 0;
  const apiMode = import.meta.env.DEV ? getApiMode() : null;

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
          {title.text}
        </h1>

        <div
          className="absolute border-b border-white/90"
          style={{
            left: designWidthPercent(accountInput.left),
            top: designHeightPercent(accountInput.top),
            width: designWidthPercent(accountInput.width),
            paddingBottom: designCqw(20),
          }}
        >
          <div className="flex items-center" style={{ gap: designCqw(12) }}>
            <input
              type="text"
              autoComplete="username"
              placeholder={accountInput.placeholder}
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="min-w-0 flex-1 border-none bg-transparent p-0 text-white outline-none"
              style={{ fontSize: designCqw(accountInput.fontSize), caretColor: "#33a1f9" }}
            />
            {account ? (
              <InputClearButton onClear={() => setAccount("")} size={inputClear.size} />
            ) : null}
          </div>
        </div>

        <div
          className="absolute border-b border-white/90"
          style={{
            left: designWidthPercent(passwordInput.left),
            top: designHeightPercent(passwordInput.top),
            width: designWidthPercent(passwordInput.width),
            paddingBottom: designCqw(20),
          }}
        >
          <div className="flex min-w-0 items-center">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={passwordInput.placeholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-w-0 flex-1 border-none bg-transparent p-0 text-white outline-none"
              style={{ fontSize: designCqw(passwordInput.fontSize), caretColor: "#33a1f9" }}
            />
            <div
              className="relative z-10 flex shrink-0 items-center"
              style={{ gap: designCqw(passwordInput.actionGap), marginLeft: designCqw(8) }}
            >
              {password ? (
                <InputClearButton onClear={() => setPassword("")} size={inputClear.size} />
              ) : null}
              <PasswordVisibilityToggle
                visible={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
                size={passwordInput.toggleSize}
              />
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
              top: `calc(${designHeightPercent(button.top)} - ${designCqw(36)})`,
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
            top: designHeightPercent(button.top),
            width: designWidthPercent(button.width),
            height: designCqw(button.height),
            borderRadius: designCqw(button.borderRadius),
            background: button.gradient,
            fontSize: designCqw(button.fontSize),
            fontWeight: 500,
            opacity: login.isPending ? 0.7 : canSubmit ? 1 : 0.55,
          }}
          disabled={login.isPending}
          onClick={() => void handleLogin()}
        >
          {login.isPending ? "登录中…" : button.text}
        </button>

        {formHint ? (
          <p
            className="absolute text-amber-200"
            style={{
              left: designWidthPercent(button.left),
              top: `calc(${designHeightPercent(button.top)} + ${designCqw(button.height + 12)})`,
              fontSize: designCqw(24),
            }}
          >
            {formHint}
          </p>
        ) : null}

        {login.error ? (
          <p
            className="absolute text-red-300"
            style={{
              left: designWidthPercent(button.left),
              top: `calc(${designHeightPercent(button.top)} + ${designCqw(button.height + 12)})`,
              fontSize: designCqw(24),
            }}
          >
            {login.error instanceof Error ? login.error.message : "登录失败"}
          </p>
        ) : null}

        <label
          className="absolute flex cursor-pointer items-center"
          style={{
            left: designWidthPercent(rememberPasswordRow.left),
            top: designHeightPercent(rememberPasswordRow.top),
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

        <Link
          to="/login/forgot-password"
          className="absolute no-underline"
          style={{
            right: designWidthPercent(forgotPasswordLink.right),
            top: designHeightPercent(forgotPasswordLink.top),
            fontSize: designCqw(forgotPasswordLink.fontSize),
            fontWeight: forgotPasswordLink.fontWeight,
            lineHeight: "normal",
            letterSpacing: 0,
            color: forgotPasswordLink.color,
          }}
        >
          {forgotPasswordLink.text}
        </Link>

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

        <label
          className="absolute flex cursor-pointer items-center"
          style={{
            left: designWidthPercent(agreement.left),
            bottom: designHeightPercent(agreement.bottom),
            gap: designCqw(12),
            fontSize: designCqw(agreement.fontSize),
            color: agreement.color,
            lineHeight: 1.4,
          }}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked);
              if (e.target.checked) setFormHint(null);
            }}
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
            <span style={{ color: agreement.linkColor }}>{agreement.linkText}</span>
          </span>
        </label>
      </div>
    </DesignScreen>
  );
}
