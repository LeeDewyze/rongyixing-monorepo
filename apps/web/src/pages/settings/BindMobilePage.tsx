import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { usePageHeader } from "@/components/layout";
import { SettingsPageChrome } from "@/components/settings/SettingsPageChrome";
import { useMobileSecurity } from "@/hooks/useAccountSecurity";
import {
  validateMobileNumber,
  validateVerificationCode,
  formatVerificationError,
} from "@/lib/account-settings";
import { formatApiError } from "@/lib/formatApiError";

const OTP_LENGTH = 6;

function maskMobile(mobile: string): string {
  const trimmed = mobile.trim();
  if (trimmed.length < 7) return trimmed;
  return `${trimmed.slice(0, 3)}****${trimmed.slice(-4)}`;
}

function StepIndicator({ step }: { step: 1 | 2 }) {
  const steps = [
    { id: 1, label: "输入手机号" },
    { id: 2, label: "验证绑定" },
  ] as const;

  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((item, index) => {
        const active = step >= item.id;
        const done = step > item.id;
        return (
          <div key={item.id} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={`flex size-5 items-center justify-center rounded-full text-[11px] font-semibold transition-colors duration-200 ${
                  active ? "bg-brand-primary text-white" : "bg-[#E8ECF2] text-[#8A94A6]"
                }`}
              >
                {done ? (
                  <svg viewBox="0 0 12 12" className="size-3" fill="none" aria-hidden>
                    <path
                      d="M2.5 6l2.5 2.5 4.5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  item.id
                )}
              </span>
              <span
                className={`text-[12px] transition-colors duration-200 ${
                  active ? "font-medium text-[#333333]" : "text-[#8A94A6]"
                }`}
              >
                {item.label}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <span
                className={`mx-1 h-px w-8 transition-colors duration-200 ${
                  step > item.id ? "bg-brand-primary" : "bg-[#E0E4EA]"
                }`}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? "");

  function focusAt(index: number) {
    const target = inputsRef.current[Math.max(0, Math.min(index, OTP_LENGTH - 1))];
    target?.focus();
    target?.select();
  }

  function applyDigits(next: string) {
    const sanitized = next.replace(/\D/g, "").slice(0, OTP_LENGTH);
    onChange(sanitized);
    if (sanitized.length < OTP_LENGTH) {
      focusAt(sanitized.length);
    }
  }

  function handleChange(index: number, nextChar: string) {
    const digit = nextChar.replace(/\D/g, "").slice(-1);
    const chars = digits.slice();
    chars[index] = digit;
    const next = chars.join("").replace(/\s/g, "");
    onChange(next);
    if (digit && index < OTP_LENGTH - 1) {
      focusAt(index + 1);
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      focusAt(index - 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    applyDigits(event.clipboardData.getData("text"));
  }

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="短信验证码">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            inputsRef.current[index] = node;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`验证码第 ${index + 1} 位`}
          className={`size-11 rounded-xl border text-center text-[20px] font-semibold text-[#333333] outline-none transition-colors duration-200 disabled:opacity-60 ${
            digit
              ? "border-brand-primary/40 bg-[#F0F6FF]"
              : "border-[#E8ECF2] bg-[#F8F9FB] focus:border-brand-primary"
          }`}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </div>
  );
}

function PageToast({ message }: { message: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-6">
      <p className="rounded-xl bg-[#333333]/90 px-4 py-2.5 text-[13px] text-white shadow-lg">
        {message}
      </p>
    </div>
  );
}

export function BindMobilePage() {
  const navigate = useNavigate();
  usePageHeader({ visible: false });
  const mobileSecurity = useMobileSecurity();

  const mobileInputRef = useRef<HTMLInputElement>(null);
  const otpContainerRef = useRef<HTMLDivElement>(null);

  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const step: 1 | 2 = codeSent ? 2 : 1;
  const trimmedMobile = mobile.trim();
  const canSendCode =
    trimmedMobile.length > 0 && !mobileSecurity.sendCode.isPending && countdown <= 0;
  const canSubmit = code.trim().length >= 4 && !mobileSecurity.submit.isPending && codeSent;

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (step === 1) {
      mobileInputRef.current?.focus();
      return;
    }
    const firstOtp = otpContainerRef.current?.querySelector("input");
    firstOtp?.focus();
  }, [step]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  async function handleSendCode() {
    const validation = validateMobileNumber(mobile);
    if (validation) {
      showToast(validation);
      return;
    }
    try {
      await mobileSecurity.sendCode.mutateAsync(trimmedMobile);
      setCode("");
      setCodeSent(true);
      setCountdown(60);
      showToast("验证码已发送");
    } catch (err) {
      showToast(formatApiError(err));
    }
  }

  async function handleSubmit() {
    const mobileError = validateMobileNumber(mobile);
    if (mobileError) {
      showToast(mobileError);
      return;
    }
    if (!codeSent) {
      showToast("请先获取验证码");
      return;
    }
    const codeError = validateVerificationCode(code);
    if (codeError) {
      showToast(codeError);
      return;
    }
    try {
      await mobileSecurity.submit.mutateAsync({ Mobile: trimmedMobile, Code: code.trim() });
      showToast("手机号设置成功");
      window.setTimeout(() => {
        navigate("/settings/security", { replace: true });
      }, 600);
    } catch (err) {
      showToast(formatVerificationError(err));
    }
  }

  return (
    <SettingsPageChrome title="手机号码" backTo="/settings/security">
      <div className={`flex min-h-full flex-col ${HOTEL_DETAIL_FONT}`}>
        <div className="flex min-h-full flex-1 flex-col rounded-t-2xl bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
          <StepIndicator step={step} />

          {step === 1 ? (
            <div className="mt-8">
              <h2 className="text-[22px] font-bold leading-snug text-[#1A1A1A]">绑定新手机号</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[#8A94A6]">
                请输入本人实名认证的手机号，验证码将发送至该号码
              </p>

              <label className="mt-8 block">
                <span className="mb-2 block text-[13px] font-medium text-[#5C6678]">手机号码</span>
                <div className="flex items-center gap-3 rounded-xl border border-[#E8ECF2] bg-[#F8F9FB] px-4 py-3 transition-colors duration-200 focus-within:border-brand-primary focus-within:bg-white">
                  <span className="shrink-0 text-[16px] font-medium text-[#333333]">+86</span>
                  <span className="h-4 w-px shrink-0 bg-[#E0E4EA]" aria-hidden />
                  <input
                    ref={mobileInputRef}
                    type="tel"
                    inputMode="numeric"
                    value={mobile}
                    onChange={(event) =>
                      setMobile(event.target.value.replace(/\D/g, "").slice(0, 11))
                    }
                    className="min-w-0 flex-1 border-none bg-transparent text-[16px] text-[#333333] outline-none placeholder:text-[#C5C5D0]"
                    placeholder="请输入新绑定的手机号"
                    autoComplete="tel"
                  />
                  {trimmedMobile ? (
                    <button
                      type="button"
                      aria-label="清空手机号"
                      className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#D8DCE3] text-white transition-opacity duration-200 active:opacity-70"
                      onClick={() => setMobile("")}
                    >
                      <svg viewBox="0 0 12 12" className="size-2.5" fill="none" aria-hidden>
                        <path
                          d="M3 3l6 6M9 3l-6 6"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  ) : null}
                </div>
              </label>

              <button
                type="button"
                className="mt-10 flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-[17px] font-medium text-white shadow-[0_8px_20px_rgba(39,104,250,0.28)] transition-opacity duration-200 active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canSendCode}
                onClick={() => void handleSendCode()}
              >
                {mobileSecurity.sendCode.isPending ? "发送中…" : "获取验证码"}
              </button>
            </div>
          ) : (
            <div className="mt-8">
              <h2 className="text-[22px] font-bold leading-snug text-[#1A1A1A]">输入验证码</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[#8A94A6]">
                验证码已发送至{" "}
                <span className="font-medium text-[#333333]">+86 {maskMobile(trimmedMobile)}</span>
              </p>

              <div className="mt-8" ref={otpContainerRef}>
                <span className="mb-3 block text-[13px] font-medium text-[#5C6678]">
                  短信验证码
                </span>
                <OtpInput
                  value={code}
                  onChange={setCode}
                  disabled={mobileSecurity.submit.isPending}
                />
              </div>

              <div className="mt-5 text-center">
                <button
                  type="button"
                  className="cursor-pointer text-[14px] text-brand-primary transition-opacity duration-200 active:opacity-70 disabled:cursor-not-allowed disabled:text-[#BBBBBB]"
                  disabled={countdown > 0 || mobileSecurity.sendCode.isPending}
                  onClick={() => void handleSendCode()}
                >
                  {countdown > 0
                    ? `${countdown}s 后可重新发送`
                    : mobileSecurity.sendCode.isPending
                      ? "发送中…"
                      : "重新发送验证码"}
                </button>
              </div>

              <button
                type="button"
                className="mt-10 flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-[17px] font-medium text-white shadow-[0_8px_20px_rgba(39,104,250,0.28)] transition-opacity duration-200 active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canSubmit}
                onClick={() => void handleSubmit()}
              >
                {mobileSecurity.submit.isPending ? "提交中…" : "完成"}
              </button>
            </div>
          )}
        </div>
      </div>

      {toast ? <PageToast message={toast} /> : null}
    </SettingsPageChrome>
  );
}
