import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import type { ForgotPasswordValidType } from "@ryx/shared-types";

import { useForgotPasswordFlow } from "@/hooks/useAccountSecurity";
import { validateForgotPasswordReset, validateVerificationCode } from "@/lib/account-settings";
import { formatApiError } from "@/lib/formatApiError";

type ForgotStep = "check" | "valid" | "reset" | "done";

const STEP_LABELS: Record<ForgotStep, string> = {
  check: "验证账号",
  valid: "安全验证",
  reset: "设置密码",
  done: "完成",
};

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden>
      <path
        d="M12 5l-5 5 5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {visible ? (
        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      ) : (
        <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      )}
    </svg>
  );
}

function FieldRow({
  label,
  value,
  placeholder,
  type = "text",
  autoComplete,
  right,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  type?: "text" | "password";
  autoComplete?: string;
  right?: ReactNode;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[14px] font-medium text-[#5C6678]">{label}</span>
      <div className="flex h-12 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 focus-within:border-brand-primary/50 focus-within:shadow-[0_0_0_3px_rgba(39,104,250,0.08)]">
        <input
          type={type}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="min-w-0 flex-1 border-none bg-transparent text-[16px] text-brand-title outline-none placeholder:text-[#B6BFCC]"
          onChange={(event) => onChange(event.target.value)}
        />
        {right}
      </div>
    </label>
  );
}

function StepIndicator({ step }: { step: ForgotStep }) {
  const items: ForgotStep[] = ["check", "valid", "reset"];
  const activeIndex = Math.max(0, items.indexOf(step));
  return (
    <div className="flex items-center gap-2">
      {items.map((item, index) => {
        const active = index <= activeIndex;
        return (
          <div key={item} className="flex flex-1 items-center gap-2">
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${
                active ? "bg-brand-primary text-white" : "bg-[#E8EEF8] text-[#8A94A6]"
              }`}
            >
              {index + 1}
            </span>
            <span
              className={`hidden text-[12px] font-medium min-[360px]:inline ${
                active ? "text-brand-primary" : "text-[#8A94A6]"
              }`}
            >
              {STEP_LABELS[item]}
            </span>
            {index < items.length - 1 ? (
              <span className={`h-px flex-1 ${index < activeIndex ? "bg-brand-primary" : "bg-[#DDE5F2]"}`} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function PasswordRules({ password }: { password: string }) {
  const rules = useMemo(
    () => [
      { label: "8-30 位字符", met: password.length >= 8 && password.length <= 30 },
      { label: "包含小写字母", met: /[a-z]/.test(password) },
      { label: "包含大写字母", met: /[A-Z]/.test(password) },
    ],
    [password],
  );

  return (
    <div className="rounded-xl border border-[#D6E8FF] bg-[#F5F9FF] px-4 py-3">
      <p className="mb-2 text-[13px] font-medium text-[#344054]">密码规则</p>
      <div className="grid grid-cols-1 gap-1.5 text-[12px] min-[360px]:grid-cols-3">
        {rules.map((rule) => (
          <span key={rule.label} className={rule.met ? "text-[#22A06B]" : "text-[#8A94A6]"}>
            {rule.met ? "✓ " : "• "}
            {rule.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const flow = useForgotPasswordFlow();
  const [step, setStep] = useState<ForgotStep>("check");
  const [account, setAccount] = useState("");
  const [validTypes, setValidTypes] = useState<ForgotPasswordValidType[]>([]);
  const [validateType, setValidateType] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const pending =
    flow.checkAccount.isPending ||
    flow.sendCode.isPending ||
    flow.validateCode.isPending ||
    flow.resetPassword.isPending;

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  async function handleCheckAccount() {
    const name = account.trim();
    if (!name) {
      setMessage("请输入账户");
      return;
    }
    setMessage(null);
    try {
      const result = await flow.checkAccount.mutateAsync(name);
      const items = result.ValidTypes ?? [];
      setValidTypes(items);
      setValidateType(items[0]?.Type ?? "");
      setCode("");
      if (items.length === 0) {
        setMessage("您尚未绑定邮箱或者手机号，请联系管理员找回密码");
        return;
      }
      setStep("valid");
    } catch (error) {
      setMessage(formatApiError(error));
    }
  }

  async function handleSendCode() {
    if (!validateType || countdown > 0) return;
    setMessage(null);
    try {
      const result = await flow.sendCode.mutateAsync({
        Name: account.trim(),
        ValidateType: validateType,
      });
      setCountdown(result.SendInterval || 60);
      setMessage("验证码已发送");
    } catch (error) {
      setMessage(formatApiError(error));
    }
  }

  async function handleValidateCode() {
    const validation = validateVerificationCode(code);
    if (validation) {
      setMessage(validation);
      return;
    }
    setMessage(null);
    try {
      await flow.validateCode.mutateAsync({
        Name: account.trim(),
        ValidateType: validateType,
        ValidateValue: code.trim(),
      });
      setStep("reset");
    } catch (error) {
      setMessage(formatApiError(error));
    }
  }

  async function handleResetPassword() {
    const validation = validateForgotPasswordReset({ password, confirmPassword });
    if (validation) {
      setMessage(validation);
      return;
    }
    setMessage(null);
    try {
      await flow.resetPassword.mutateAsync({
        Name: account.trim(),
        Password: password.trim(),
        SurePassword: confirmPassword.trim(),
      });
      setStep("done");
      setMessage("密码重置成功，请重新登录");
      window.setTimeout(() => navigate("/login/password", { replace: true }), 900);
    } catch (error) {
      setMessage(formatApiError(error));
    }
  }

  return (
    <div
      className="flex min-h-dvh flex-col bg-[#F5F6F9]"
      style={{ background: "var(--brand-form-header-gradient)" }}
    >
      <header className="shrink-0 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center px-1 pb-3 pt-1">
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-brand-title active:bg-white/30"
            aria-label="返回登录"
            onClick={() => navigate("/login/password")}
          >
            <BackIcon />
          </button>
          <h1 className="min-w-0 flex-1 text-center text-[17px] font-semibold text-brand-title">
            找回密码
          </h1>
          <span className="size-10 shrink-0" aria-hidden />
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <section className="pt-3">
          <h2 className="text-[24px] font-bold leading-tight text-brand-title">
            {step === "done" ? "重置完成" : STEP_LABELS[step]}
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[#5C6678]">
            按 legacy 安全流程校验账户信息，验证通过后即可设置新的登录密码。
          </p>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <StepIndicator step={step} />

          {step === "check" ? (
            <div className="mt-7 space-y-5">
              <FieldRow
                label="账户"
                value={account}
                placeholder="请输入账户"
                autoComplete="username"
                onChange={(value) => {
                  setAccount(value);
                  setMessage(null);
                }}
              />
              <button
                type="button"
                className="flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-[17px] font-medium text-white shadow-[0_8px_20px_rgba(39,104,250,0.24)] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={pending || !account.trim()}
                onClick={() => void handleCheckAccount()}
              >
                {flow.checkAccount.isPending ? "校验中…" : "下一步"}
              </button>
            </div>
          ) : null}

          {step === "valid" ? (
            <div className="mt-7 space-y-5">
              <div>
                <p className="mb-2 text-[14px] font-medium text-[#5C6678]">选择验证方式</p>
                <div className="space-y-2">
                  {validTypes.map((item) => (
                    <label
                      key={item.Type}
                      className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 ${
                        validateType === item.Type
                          ? "border-brand-primary bg-brand-primary/5"
                          : "border-[#E2E8F0] bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={validateType === item.Type}
                        className="size-4 accent-brand-primary"
                        onChange={() => setValidateType(item.Type)}
                      />
                      <span className="min-w-0 flex-1 text-[15px] text-brand-title">
                        {item.Name}
                        {item.Value ? <span className="ml-2 text-[#8A94A6]">{item.Value}</span> : null}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <FieldRow
                label="验证码"
                value={code}
                placeholder="请输入验证码"
                autoComplete="one-time-code"
                onChange={(value) => {
                  setCode(value);
                  setMessage(null);
                }}
                right={
                  <button
                    type="button"
                    className="whitespace-nowrap rounded-full px-2 py-1 text-[14px] font-medium text-brand-primary disabled:text-[#98A2B3]"
                    disabled={pending || !validateType || countdown > 0}
                    onClick={() => void handleSendCode()}
                  >
                    {countdown > 0
                      ? `${countdown}s`
                      : flow.sendCode.isPending
                        ? "发送中"
                        : "发送验证码"}
                  </button>
                }
              />
              <button
                type="button"
                className="flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-[17px] font-medium text-white shadow-[0_8px_20px_rgba(39,104,250,0.24)] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={pending || !code.trim()}
                onClick={() => void handleValidateCode()}
              >
                {flow.validateCode.isPending ? "验证中…" : "下一步"}
              </button>
            </div>
          ) : null}

          {step === "reset" || step === "done" ? (
            <div className="mt-7 space-y-5">
              <FieldRow
                label="新密码"
                value={password}
                placeholder="请输入新密码"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                onChange={(value) => {
                  setPassword(value);
                  setMessage(null);
                }}
                right={
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center rounded-full text-[#8A94A6]"
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                }
              />
              <FieldRow
                label="确认密码"
                value={confirmPassword}
                placeholder="请再次输入新密码"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                onChange={(value) => {
                  setConfirmPassword(value);
                  setMessage(null);
                }}
                right={
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center rounded-full text-[#8A94A6]"
                    aria-label={showConfirmPassword ? "隐藏密码" : "显示密码"}
                    onClick={() => setShowConfirmPassword((value) => !value)}
                  >
                    <EyeIcon visible={showConfirmPassword} />
                  </button>
                }
              />
              <PasswordRules password={password} />
              <button
                type="button"
                className="flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-[17px] font-medium text-white shadow-[0_8px_20px_rgba(39,104,250,0.24)] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={pending || step === "done"}
                onClick={() => void handleResetPassword()}
              >
                {flow.resetPassword.isPending ? "提交中…" : step === "done" ? "已完成" : "完成"}
              </button>
            </div>
          ) : null}

          {message ? (
            <p className="mt-4 rounded-xl bg-[#FFF7E8] px-3 py-2 text-[13px] leading-relaxed text-[#B35A00]" role="alert">
              {message}
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
