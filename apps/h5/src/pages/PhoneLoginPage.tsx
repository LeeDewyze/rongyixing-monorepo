import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import loginBg from "@/assets/login/bg.png";
import countryChevronSrc from "@/assets/login/country-chevron.png";
import scanIconSrc from "@/assets/login/scan-icon.png";
import { DesignScreen } from "@/components/DesignScreen";
import { designCqw, designHeightPercent, designWidthPercent } from "@/config/design";
import { LOGIN_FONT, LOGIN_LAYOUT } from "@/config/login";

const {
  paddingX,
  headerTop,
  backButton,
  headerActions,
  overlay,
  title,
  subtitle,
  phoneInput,
  button,
  passwordLink,
  agreement,
} = LOGIN_LAYOUT;

export function PhoneLoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);

  return (
    <DesignScreen>
      {/* Background image — airplane wing anchored at bottom */}
      <img
        src={loginBg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-bottom"
        aria-hidden
      />
      {/* Semi-transparent overlay on top of background (750×1624, rgba(0,0,0,0.5)) */}
      <div className="absolute inset-0" style={{ background: overlay.background }} aria-hidden />

      <div className="relative z-10 h-full w-full" style={{ fontFamily: LOGIN_FONT }}>
        {/* Header */}
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

        <div
          className="absolute flex items-center"
          style={{
            right: designWidthPercent(headerActions.scanRight),
            top: designHeightPercent(headerActions.top),
            gap: designCqw(headerActions.gap),
          }}
        >
          <Link
            to="/register"
            className="text-white no-underline"
            style={{ fontSize: designCqw(28), lineHeight: 1.2 }}
          >
            注册
          </Link>
          <button
            type="button"
            aria-label="Scan QR code"
            className="border-none bg-transparent p-0"
            style={{
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
        </div>

        {/* Title */}
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
            opacity: 1,
          }}
        >
          {title.text}
        </h1>

        {/* Subtitle */}
        <p
          className="absolute m-0"
          style={{
            left: designWidthPercent(subtitle.left),
            top: designHeightPercent(subtitle.top),
            width: designWidthPercent(subtitle.width),
            minHeight: designHeightPercent(subtitle.height),
            fontSize: designCqw(subtitle.fontSize),
            fontWeight: subtitle.fontWeight,
            lineHeight: "normal",
            letterSpacing: 0,
            color: subtitle.color,
            opacity: 1,
          }}
        >
          {subtitle.text}
        </p>

        {/* Phone input */}
        <div
          className="absolute border-b border-white/90"
          style={{
            left: designWidthPercent(phoneInput.left),
            top: designHeightPercent(phoneInput.top),
            width: designWidthPercent(phoneInput.width),
            paddingBottom: designCqw(20),
          }}
        >
          <div className="relative flex items-center" style={{ gap: designCqw(16) }}>
            <button
              type="button"
              className="relative shrink-0 border-none bg-transparent p-0"
              style={{
                width: designCqw(
                  phoneInput.countryCode.width +
                    phoneInput.countryChevron.gap +
                    phoneInput.countryChevron.width,
                ),
                height: designCqw(phoneInput.countryCode.height),
              }}
            >
              <span
                className="absolute"
                style={{
                  left: 0,
                  top: 0,
                  width: designCqw(phoneInput.countryCode.width),
                  height: designCqw(phoneInput.countryCode.height),
                  fontSize: designCqw(phoneInput.countryCode.fontSize),
                  fontWeight: phoneInput.countryCode.fontWeight,
                  lineHeight: "normal",
                  letterSpacing: 0,
                  color: phoneInput.countryCode.color,
                  opacity: 1,
                }}
              >
                + 86
              </span>
              <img
                src={countryChevronSrc}
                alt=""
                aria-hidden
                className="absolute object-contain"
                style={{
                  left: designCqw(
                    phoneInput.countryCode.width + phoneInput.countryChevron.gap,
                  ),
                  top: "50%",
                  width: designCqw(phoneInput.countryChevron.width),
                  aspectRatio: `${phoneInput.countryChevron.intrinsicWidth} / ${phoneInput.countryChevron.intrinsicHeight}`,
                  height: "auto",
                  transform: "translateY(-50%)",
                  opacity: 1,
                }}
              />
            </button>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              className="min-w-0 flex-1 border-none bg-transparent p-0 text-white outline-none"
              style={{
                fontSize: designCqw(phoneInput.fontSize),
                caretColor: "#33a1f9",
              }}
            />
          </div>
          <style>{`
            input::placeholder {
              color: ${phoneInput.placeholderColor};
              font-size: ${designCqw(phoneInput.fontSize)};
            }
          `}</style>
        </div>

        {/* Get verification code */}
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
        >
          {button.text}
        </button>

        {/* Password login link */}
        <Link
          to="/login/password"
          className="absolute no-underline"
          style={{
            left: designWidthPercent(passwordLink.left),
            top: designHeightPercent(passwordLink.top),
            fontSize: designCqw(passwordLink.fontSize),
            fontWeight: passwordLink.fontWeight,
            lineHeight: "normal",
            letterSpacing: 0,
            color: passwordLink.color,
          }}
        >
          {passwordLink.text}
        </Link>

        {/* Agreement — left-aligned at bottom */}
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
