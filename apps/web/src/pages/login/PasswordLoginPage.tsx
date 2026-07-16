import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { LegalDocumentSheet } from "@/components/contact/LegalDocumentSheet";
import { useMobileLogin, usePasswordLogin, useSendLoginCode } from "@/hooks/useAuth";
import { resolveInternalReturnTo } from "@/lib/base-path";
import {
  contactUrlOptionsFromApiConfig,
  getPrivacyPolicyUrl,
  getUserAgreementUrl,
} from "@/lib/contact-us";
import {
  clearRememberedCredentials,
  loadRememberedCredentials,
  saveRememberedCredentials,
} from "@/lib/remember-credentials";

type LoginMode = "password" | "sms";
type LegalDoc = "agreement" | "privacy" | null;

type InputFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  autoComplete: string;
  type?: "text" | "password";
  rightAction?: ReactNode;
  onChange: (value: string) => void;
  onClear?: () => void;
  icon?: ReactNode;
};

function FeaturePill({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/80 px-4 py-2 text-[15px] font-semibold text-brand-primary shadow-[0_12px_26px_rgba(39,104,250,0.08)] backdrop-blur-xl">
      {children}
    </span>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-brand-primary" aria-hidden="true">
      <path
        d="M20 21a8 8 0 0 0-16 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="7"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-brand-primary" aria-hidden="true">
      <rect
        x="4"
        y="10"
        width="16"
        height="10"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-brand-primary" aria-hidden="true">
      <rect
        x="7"
        y="2"
        width="10"
        height="20"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M11 18h2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconCode() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-brand-primary" aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M7 9h4M7 13h2M15 13h2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconEye({ visible }: { visible: boolean }) {
  return visible ? (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-brand-primary" aria-hidden="true">
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-brand-primary" aria-hidden="true">
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 4l16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconClear() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
      <path
        d="M8 8l8 8M16 8l-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InputField({
  label,
  value,
  placeholder,
  autoComplete,
  type = "text",
  rightAction,
  onChange,
  onClear,
  icon,
}: InputFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-[15px] font-medium text-[#344054]">{label}</span>
      <div className="flex h-14 items-center gap-3 rounded-xl border border-[#D8E2F4] bg-[#F8FAFF] px-4 text-[#98A2B3] transition-shadow duration-200 focus-within:border-brand-primary/30 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(39,104,250,0.08)]">
        {icon ?? (label === "账号" ? <IconUser /> : <IconLock />)}
        <input
          type={type}
          autoComplete={autoComplete}
          value={value}
          placeholder={placeholder}
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[16px] text-brand-title outline-none placeholder:text-[#98A2B3]"
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="flex items-center gap-2">{rightAction}</div>
        {value && onClear ? (
          <button
            type="button"
            aria-label={`清空${label}`}
            className="inline-flex size-8 items-center justify-center rounded-full text-[#98A2B3] transition-colors hover:bg-brand-primary/10 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 active:scale-95"
            onClick={onClear}
          >
            <IconClear />
          </button>
        ) : null}
      </div>
    </label>
  );
}

function HeroScene() {
  return (
    <div
      className="relative overflow-hidden rounded-[34px] border border-white/40 bg-white/20 shadow-[0_32px_90px_rgba(16,55,130,0.14)] backdrop-blur-2xl"
      style={{ minHeight: 332 }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.42)_0%,rgba(255,255,255,0.16)_55%,rgba(255,255,255,0.3)_100%)]" />
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(circle at 18% 24%, rgba(255,255,255,0.84), transparent 18%), radial-gradient(circle at 78% 18%, rgba(255,255,255,0.72), transparent 14%), radial-gradient(circle at 52% 78%, rgba(255,255,255,0.26), transparent 34%)",
        }}
      />
      <div
        className="absolute right-[40px] top-[36px] h-[260px] border-t-[4px] border-white/70"
        style={{
          left: 60,
          borderRadius: "999px 999px 0 0",
          transform: "rotate(-6deg)",
        }}
      />
      <div className="absolute left-[60px] top-[31px] size-[14px] rounded-full bg-white shadow-[0_0_0_8px_rgba(255,255,255,0.22)]" />
      <div className="absolute right-[82px] top-[30px] size-[14px] rounded-full bg-white shadow-[0_0_0_8px_rgba(255,255,255,0.22)]" />

      <div
        className="absolute left-[58px] bottom-[34px] h-[112px] w-[430px] max-w-[calc(100%-112px)] bg-white/90 shadow-[0_24px_70px_rgba(30,70,140,0.18)]"
        style={{ borderRadius: "28px 48px 28px 28px" }}
      >
        <div className="absolute left-[30px] top-[25px] h-[40px] w-[246px] rounded-[18px] bg-[linear-gradient(90deg,rgba(39,104,250,0.12),rgba(51,161,249,0.32))] shadow-[152px_0_0_rgba(39,104,250,0.15)]" />
        <div className="absolute left-[40px] right-[38px] bottom-[16px] h-[5px] rounded-full bg-brand-primary" />
      </div>

      <div className="absolute hidden xl:block" style={{ left: 440, right: 68, bottom: 34, height: 230 }}>
        {[
          { left: 0, height: 154 },
          { left: 100, height: 210 },
          { left: 218, height: 132 },
          { left: 338, height: 184 },
        ].map((bar, index) => (
          <div
            key={index}
            className="absolute bottom-0 w-[80px] border border-white/60 bg-white/60"
            style={{
              left: bar.left,
              height: bar.height,
              borderRadius: "14px 14px 4px 4px",
            }}
          >
            <div className="absolute inset-x-[16px] top-[24px] bottom-[24px] flex justify-between">
              <span className="h-full w-[12px] rounded-full bg-brand-primary/20" />
              <span className="h-full w-[12px] rounded-full bg-brand-primary/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getInitialFormState() {
  const remembered = loadRememberedCredentials();
  return {
    account: remembered?.account ?? "",
    password: remembered?.password ?? "",
    rememberChecked: remembered !== null,
  };
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
  const [rememberChecked, setRememberChecked] = useState(initialForm.rememberChecked);
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [formHint, setFormHint] = useState<string | null>(null);
  const [legalDoc, setLegalDoc] = useState<LegalDoc>(null);

  useEffect(() => {
    document.title = "融易行 - 登录";
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

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
    navigate(resolveInternalReturnTo(returnTo, "/"));
  }

  async function handleLogin() {
    if (login.isPending || mobileLogin.isPending) return;
    if (loginMode === "sms") {
      await handleSmsLogin();
      return;
    }

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
      navigateAfterLogin();
    } catch {
      // Login error is surfaced through mutation state.
    }
  }

  async function handleSendCode() {
    if (sendCode.isPending || countdown > 0) return;
    const trimmedMobile = mobile.trim();
    if (!trimmedMobile) {
      setFormHint("请输入手机号");
      return;
    }
    if (!/^1\d{10}$/.test(trimmedMobile)) {
      setFormHint("请输入正确的手机号");
      return;
    }
    setFormHint(null);
    try {
      await sendCode.mutateAsync(trimmedMobile);
      setCodeSent(true);
      setSmsCode("");
      setCountdown(60);
      setFormHint("验证码已发送");
    } catch {
      // Error surfaced via sendCode.error.
    }
  }

  async function handleSmsLogin() {
    if (!mobile.trim()) {
      setFormHint("请输入手机号");
      return;
    }
    if (!/^1\d{10}$/.test(mobile.trim())) {
      setFormHint("请输入正确的手机号");
      return;
    }
    if (!smsCode.trim()) {
      setFormHint("请输入验证码");
      return;
    }
    if (!agreed) {
      setFormHint("请先阅读并同意用户协议");
      return;
    }

    setFormHint(null);
    try {
      await mobileLogin.mutateAsync({ Mobile: mobile.trim(), Code: smsCode.trim() });
      navigateAfterLogin();
    } catch {
      // Error surfaced through mutation state.
    }
  }

  const pending = login.isPending || mobileLogin.isPending;
  const authError = loginMode === "password" ? login.error : mobileLogin.error || sendCode.error;
  const canSubmit =
    agreed &&
    (loginMode === "password"
      ? account.trim().length > 0 && password.length > 0
      : mobile.trim().length > 0 && smsCode.trim().length > 0);

  return (
    <div
      className="relative h-dvh overflow-hidden bg-[#F5F6F9] text-brand-title"
      style={{
        background:
          "radial-gradient(circle at 20% 12%, rgba(39, 104, 250, 0.52), transparent 34%), radial-gradient(circle at 72% 6%, rgba(51, 161, 249, 0.3), transparent 35%), linear-gradient(180deg, var(--brand-form-header-start) 0%, var(--brand-form-header-end) 48%)",
      }}
    >
      <div className="relative z-10 flex h-full flex-col overflow-y-auto">
        <div
          className="mx-auto flex w-full flex-1 flex-col justify-center px-4 py-6 pad:px-8 pad:py-8 lg:flex-row lg:items-center lg:gap-16 lg:px-14 lg:py-10"
          style={{ maxWidth: 1600 }}
        >
          <section className="flex min-w-0 flex-1 flex-col lg:pr-2">
            <div className="max-w-[760px]">
              <h1
                className="m-0 text-[clamp(4rem,5vw,7rem)] font-black leading-[0.94] tracking-tight text-white drop-shadow-[0_16px_46px_rgba(19,66,144,0.24)]"
              >
                融易行
              </h1>
              <h2 className="mt-6 m-0 text-[clamp(2.25rem,2.9vw,3.25rem)] font-extrabold leading-[1.08] tracking-tight text-white">
                企业出行一站式管理平台
              </h2>
              <p className="mt-6 max-w-[30rem] text-[clamp(1.05rem,1.3vw,1.5rem)] leading-[1.65] text-white/90">
                整合机票、火车、酒店、审批与支付流程，让企业差旅更清晰、更高效。
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <FeaturePill>统一审批</FeaturePill>
                <FeaturePill>企业支付</FeaturePill>
                <FeaturePill>订单可追踪</FeaturePill>
              </div>
            </div>

            <div className="mt-10 w-full max-w-[960px]">
              <HeroScene />
            </div>
          </section>

          <aside className="mt-8 w-full shrink-0 lg:mt-0" style={{ width: 480, maxWidth: "100%" }}>
            <div className="rounded-[32px] border border-white/80 bg-white/90 px-10 py-10 shadow-[0_34px_90px_rgba(16,55,130,0.2),0_8px_28px_rgba(16,55,130,0.08)] backdrop-blur-2xl">
              <h3 className="mb-2 text-[clamp(2rem,2.2vw,2.5rem)] font-bold leading-tight tracking-tight text-brand-title">
                欢迎登录
              </h3>
              <p className="m-0 text-[18px] leading-relaxed text-[#667085]">融易行企业差旅平台</p>

              <div className="mt-8 inline-flex rounded-full bg-[#EEF5FF] p-1">
                <button
                  type="button"
                  className={`inline-flex h-11 items-center justify-center rounded-full px-6 text-[15px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 active:scale-[0.98] ${
                    loginMode === "password"
                      ? "bg-white font-semibold text-brand-primary shadow-[0_8px_18px_rgba(39,104,250,0.12)]"
                      : "font-medium text-[#667085] hover:text-brand-primary"
                  }`}
                  onClick={() => {
                    setLoginMode("password");
                    setFormHint(null);
                  }}
                >
                  账号登录
                </button>
                <button
                  type="button"
                  className={`inline-flex h-11 items-center justify-center rounded-full px-6 text-[15px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 active:scale-[0.98] ${
                    loginMode === "sms"
                      ? "bg-white font-semibold text-brand-primary shadow-[0_8px_18px_rgba(39,104,250,0.12)]"
                      : "font-medium text-[#667085] hover:text-brand-primary"
                  }`}
                  onClick={() => {
                    setLoginMode("sms");
                    setFormHint(null);
                  }}
                >
                  短信登录
                </button>
              </div>

              <div className="mt-8 space-y-5">
                {loginMode === "password" ? (
                  <>
                    <InputField
                      label="账号"
                      value={account}
                      placeholder="请输入账号"
                      autoComplete="username"
                      onChange={setAccount}
                      onClear={() => setAccount("")}
                    />
                    <label className="block">
                      <span className="mb-2 block text-[15px] font-medium text-[#344054]">密码</span>
                      <div className="flex h-14 items-center gap-3 rounded-xl border border-[#D8E2F4] bg-[#F8FAFF] px-4 text-[#98A2B3] transition-shadow duration-200 focus-within:border-brand-primary/30 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(39,104,250,0.08)]">
                        <IconLock />
                        <input
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          value={password}
                          placeholder="请输入密码"
                          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[16px] text-brand-title outline-none placeholder:text-[#98A2B3]"
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? "隐藏密码" : "显示密码"}
                          className="inline-flex size-8 items-center justify-center rounded-full text-[#98A2B3] transition-colors hover:bg-brand-primary/10 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 active:scale-95"
                          onClick={() => setShowPassword((value) => !value)}
                        >
                          <IconEye visible={showPassword} />
                        </button>
                        {password ? (
                          <button
                            type="button"
                            aria-label="清空密码"
                            className="inline-flex size-8 items-center justify-center rounded-full text-[#98A2B3] transition-colors hover:bg-brand-primary/10 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 active:scale-95"
                            onClick={() => setPassword("")}
                          >
                            <IconClear />
                          </button>
                        ) : null}
                      </div>
                    </label>
                  </>
                ) : (
                  <>
                    <InputField
                      label="手机号"
                      value={mobile}
                      placeholder="请输入手机号"
                      autoComplete="tel"
                      icon={<IconPhone />}
                      onChange={setMobile}
                      onClear={() => setMobile("")}
                    />
                    <InputField
                      label="验证码"
                      value={smsCode}
                      placeholder="请输入验证码"
                      autoComplete="one-time-code"
                      icon={<IconCode />}
                      onChange={setSmsCode}
                      onClear={() => setSmsCode("")}
                      rightAction={
                        <button
                          type="button"
                          className="whitespace-nowrap rounded-full px-2 py-1 text-[14px] font-medium text-brand-primary transition-colors hover:bg-brand-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 disabled:cursor-not-allowed disabled:text-[#98A2B3]"
                          disabled={sendCode.isPending || countdown > 0}
                          onClick={() => void handleSendCode()}
                        >
                          {countdown > 0
                            ? `${countdown}s`
                            : sendCode.isPending
                              ? "发送中"
                              : codeSent
                                ? "重新发送"
                                : "获取验证码"}
                        </button>
                      }
                    />
                  </>
                )}
              </div>

              {loginMode === "password" ? (
                <div className="mt-4 flex items-center justify-between gap-4 text-[15px] text-[#667085]">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rememberChecked}
                      className="size-4 rounded border-[#98A2B3] text-brand-primary accent-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/30"
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setRememberChecked(checked);
                        if (!checked) {
                          clearRememberedCredentials();
                        }
                      }}
                    />
                    <span>记住账号</span>
                  </label>
                  <Link
                    to="/login/forgot-password"
                    className="font-medium text-brand-primary transition-colors hover:text-brand-btn-start hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
                  >
                    忘记密码
                  </Link>
                </div>
              ) : (
                <p className="mt-4 min-h-6 text-[14px] text-[#667085]">
                  验证码将发送至您绑定的登录手机号。
                </p>
              )}

              <button
                type="button"
                className="mt-8 inline-flex h-14 w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-[18px] font-bold text-white shadow-[0_18px_32px_rgba(39,104,250,0.28)] transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={pending || !canSubmit}
                onClick={() => void handleLogin()}
              >
                {pending ? "登录中…" : "登录"}
              </button>

              {formHint ? (
                <p className="mt-3 text-center text-[14px] text-amber-500" role="alert">
                  {formHint}
                </p>
              ) : null}

              {authError ? (
                <p className="mt-3 text-center text-[14px] text-[#FF4D4F]" role="alert">
                  {authError instanceof Error ? authError.message : "登录失败"}
                </p>
              ) : null}

              <label className="mt-6 flex items-start gap-2 text-[14px] leading-6 text-[#667085]">
                <input
                  type="checkbox"
                  checked={agreed}
                  className="mt-1 size-4 rounded border-[#98A2B3] text-brand-primary accent-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/30"
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    if (e.target.checked) {
                      setFormHint(null);
                    }
                  }}
                />
                <span>
                  我已阅读并同意
                  <button
                    type="button"
                    className="text-brand-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
                    onClick={(event) => {
                      event.preventDefault();
                      setLegalDoc("agreement");
                    }}
                  >
                    《用户协议》
                  </button>
                  和
                  <button
                    type="button"
                    className="text-brand-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
                    onClick={(event) => {
                      event.preventDefault();
                      setLegalDoc("privacy");
                    }}
                  >
                    《隐私政策》
                  </button>
                </span>
              </label>

              <p className="mt-7 text-center text-[14px] text-[#98A2B3]">
                联系管理员 ·{" "}
                <button type="button" className="hover:text-brand-primary" onClick={() => setLegalDoc("privacy")}>
                  隐私政策
                </button>{" "}
                ·{" "}
                <button type="button" className="hover:text-brand-primary" onClick={() => setLegalDoc("agreement")}>
                  用户协议
                </button>
              </p>
            </div>
          </aside>
        </div>

        <footer className="pb-6 text-center text-[14px] text-[#667085]">
          © 2026 融易行 企业差旅管理平台
        </footer>
      </div>
      <LegalDocumentSheet
        open={legalDoc !== null}
        title={legalTitle}
        url={legalUrl}
        onClose={() => setLegalDoc(null)}
      />
    </div>
  );
}
