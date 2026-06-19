import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import passwordBg from "@/assets/login/password-bg.png";
import scanIconSrc from "@/assets/login/scan-icon.png";
import { DesignScreen } from "@/components/DesignScreen";
import { designCqw, designHeightPercent, designWidthPercent } from "@/config/design";
import {
  LOGIN_FONT,
  PASSWORD_LOGIN_LAYOUT,
  PASSWORD_LOGIN_SHARED,
} from "@/config/password-login";
import { usePasswordLogin } from "@/hooks/useAuth";

const {
  paddingX,
  headerTop,
  backButton,
  headerActions,
  overlay,
  agreement,
} = PASSWORD_LOGIN_SHARED;

const {
  title,
  accountInput,
  passwordInput,
  button,
  phoneCodeLink,
  forgotPasswordLink,
} = PASSWORD_LOGIN_LAYOUT;

function PasswordVisibilityToggle({
  visible,
  onToggle,
  size,
}: {
  visible: boolean;
  onToggle: () => void;
  size: number;
}) {
  return (
    <button
      type="button"
      aria-label={visible ? "Hide password" : "Show password"}
      className="flex shrink-0 items-center justify-center border-none bg-transparent p-0 text-white"
      style={{ width: designCqw(size), height: designCqw(size) }}
      onClick={onToggle}
    >
      {visible ? (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden style={{ width: "70%", height: "70%" }}>
          <path
            d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden style={{ width: "70%", height: "70%" }}>
          <path
            d="M3 3l18 18M10.6 10.6A4 4 0 0 0 12 16a4 4 0 0 0 3.4-1.9M6.7 6.7C4.6 8.1 3 10 2 12s3.5 6 10 6c1.8 0 3.4-.4 4.8-1.1M14.1 9.9A4 4 0 0 0 12 8a4 4 0 0 0-2.1.6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}

export function PasswordLoginPage() {
  const navigate = useNavigate();
  const login = usePasswordLogin();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  async function handleLogin() {
    if (!agreed || !account || !password) return;
    await login.mutateAsync({ Name: account, Password: password });
    navigate("/home");
  }

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
        <button
          type="button"
          aria-label="Go back"
          className="absolute flex items-center justify-center border-none bg-transparent p-0 text-white"
          style={{
            left: designWidthPercent(paddingX),
            top: designHeightPercent(headerTop),
            width: designCqw(backButton.size),
            height: designCqw(backButton.size),
          }}
          onClick={() => navigate(-1)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            style={{ width: designCqw(backButton.iconSize), height: designCqw(backButton.iconSize) }}
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>

        <button
          type="button"
          aria-label="Scan QR code"
          className="absolute border-none bg-transparent p-0"
          style={{
            right: designWidthPercent(headerActions.scanRight),
            top: designHeightPercent(headerActions.top),
            width: designCqw(headerActions.scanSize),
            height: designCqw(headerActions.scanSize),
          }}
        >
          <img
            src={scanIconSrc}
            alt=""
            className="h-full w-full"
            width={headerActions.scanSize}
            height={headerActions.scanSize}
          />
        </button>

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
          <input
            type="text"
            autoComplete="username"
            placeholder={accountInput.placeholder}
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="w-full border-none bg-transparent p-0 text-white outline-none"
            style={{ fontSize: designCqw(accountInput.fontSize), caretColor: "#33a1f9" }}
          />
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
          <div className="flex items-center" style={{ gap: designCqw(12) }}>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={passwordInput.placeholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-w-0 flex-1 border-none bg-transparent p-0 text-white outline-none"
              style={{ fontSize: designCqw(passwordInput.fontSize), caretColor: "#33a1f9" }}
            />
            <PasswordVisibilityToggle
              visible={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
              size={passwordInput.toggleSize}
            />
          </div>
        </div>

        <style>{`
          input::placeholder {
            color: ${accountInput.placeholderColor};
            font-size: ${designCqw(accountInput.fontSize)};
          }
        `}</style>

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
          }}
          disabled={login.isPending}
          onClick={() => void handleLogin()}
        >
          {login.isPending ? "登录中…" : button.text}
        </button>

        {login.error ? (
          <p
            className="absolute text-red-300"
            style={{
              left: designWidthPercent(button.left),
              top: designHeightPercent(button.top + 8),
              fontSize: designCqw(24),
            }}
          >
            {login.error instanceof Error ? login.error.message : "登录失败"}
          </p>
        ) : null}

        <Link
          to="/login"
          className="absolute no-underline"
          style={{
            left: designWidthPercent(phoneCodeLink.left),
            top: designHeightPercent(phoneCodeLink.top),
            fontSize: designCqw(phoneCodeLink.fontSize),
            fontWeight: phoneCodeLink.fontWeight,
            lineHeight: "normal",
            letterSpacing: 0,
            color: phoneCodeLink.color,
          }}
        >
          {phoneCodeLink.text}
        </Link>

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
            onChange={(e) => setAgreed(e.target.checked)}
            className="login-agreement-checkbox shrink-0 appearance-none rounded-full border border-white/70 bg-transparent"
            style={{ width: designCqw(agreement.checkboxSize), height: designCqw(agreement.checkboxSize) }}
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
