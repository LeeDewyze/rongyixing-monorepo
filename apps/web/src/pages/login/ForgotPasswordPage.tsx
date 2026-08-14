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
      <span className="mb-2 block text-[15px] font-medium text-[#344054]">{label}</span>
      <div className="flex h-14 items-center gap-3 rounded-xl border border-[#D8E2F4] bg-[#F8FAFF] px-4 transition-shadow duration-200 focus-within:border-brand-primary/30 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(39,104,250,0.08)]">
        <input
          type={type}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[16px] text-brand-title outline-none placeholder:text-[#98A2B3]"
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
    <div className="grid grid-cols-3 gap-3">
      {items.map((item, index) => {
        const active = index <= activeIndex;
        return (
          <div
            key={item}
            className={`rounded-xl border px-3 py-3 ${
              active
                ? "border-brand-primary/30 bg-brand-primary/5"
                : "border-[#E5ECF7] bg-[#F8FAFF]"
            }`}
          >
            <span
              className={`flex size-7 items-center justify-center rounded-full text-[13px] font-semibold ${
                active ? "bg-brand-primary text-white" : "bg-[#E8EEF8] text-[#8A94A6]"
              }`}
            >
              {index + 1}
            </span>
            <p
              className={`mt-2 text-[14px] font-medium ${active ? "text-brand-primary" : "text-[#667085]"}`}
            >
              {STEP_LABELS[item]}
            </p>
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
    <div className="rounded-xl border border-[#D6E8FF] bg-[#F5F9FF] px-4 py-3.5">
      <p className="mb-2 text-[13px] font-medium text-[#344054]">密码规则</p>
      <div className="grid grid-cols-3 gap-2 text-[13px]">
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
    document.title = "融易行 - 找回密码";
  }, []);

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
      className="ryx-viewport-h relative overflow-hidden bg-[#F5F6F9] text-brand-title"
      style={{
        background:
          "radial-gradient(circle at 20% 12%, rgba(39, 104, 250, 0.52), transparent 34%), radial-gradient(circle at 72% 6%, rgba(51, 161, 249, 0.3), transparent 35%), linear-gradient(180deg, var(--brand-form-header-start) 0%, var(--brand-form-header-end) 48%)",
      }}
    >
      <div className="relative z-10 flex h-full flex-col overflow-y-auto">
        <div
          className="mx-auto flex w-full flex-1 flex-col justify-center px-6 py-8"
          style={{ maxWidth: 920 }}
        >
          <button
            type="button"
            className="mb-5 inline-flex h-10 w-fit items-center gap-2 rounded-full bg-white/70 px-4 text-[14px] font-medium text-brand-primary shadow-[0_10px_28px_rgba(39,104,250,0.08)] backdrop-blur-xl transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 active:scale-[0.98]"
            onClick={() => navigate("/login/password")}
          >
            <BackIcon />
            返回登录
          </button>

          <main className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <section className="pt-4">
              <p className="text-[15px] font-semibold text-brand-primary">融易行账户安全</p>
              <h1 className="mt-3 text-[42px] font-bold leading-tight text-brand-title">
                找回密码
              </h1>
              <p className="mt-4 max-w-[24rem] text-[17px] leading-8 text-[#344054]">
                请验证账户信息，验证通过后即可设置新的登录密码。
              </p>
            </section>

            <section className="rounded-[24px] border border-white/70 bg-white/90 p-8 shadow-[0_34px_90px_rgba(16,55,130,0.14)] backdrop-blur-xl">
              <StepIndicator step={step} />

              {step === "check" ? (
                <div className="mt-8 space-y-5">
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
                    className="inline-flex h-14 w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-[18px] font-bold text-white shadow-[0_18px_32px_rgba(39,104,250,0.28)] transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={pending || !account.trim()}
                    onClick={() => void handleCheckAccount()}
                  >
                    {flow.checkAccount.isPending ? "校验中…" : "下一步"}
                  </button>
                </div>
              ) : null}

              {step === "valid" ? (
                <div className="mt-8 space-y-5">
                  <div>
                    <p className="mb-2 text-[15px] font-medium text-[#344054]">选择验证方式</p>
                    <div className="grid gap-2">
                      {validTypes.map((item) => (
                        <label
                          key={item.Type}
                          className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 ${
                            validateType === item.Type
                              ? "border-brand-primary bg-brand-primary/5"
                              : "border-[#E5ECF7] bg-[#F8FAFF]"
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
                            {item.Value ? (
                              <span className="ml-2 text-[#667085]">{item.Value}</span>
                            ) : null}
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
                        className="whitespace-nowrap rounded-full px-2 py-1 text-[14px] font-medium text-brand-primary transition-colors hover:bg-brand-primary/10 disabled:cursor-not-allowed disabled:text-[#98A2B3]"
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
                    className="inline-flex h-14 w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-[18px] font-bold text-white shadow-[0_18px_32px_rgba(39,104,250,0.28)] transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={pending || !code.trim()}
                    onClick={() => void handleValidateCode()}
                  >
                    {flow.validateCode.isPending ? "验证中…" : "下一步"}
                  </button>
                </div>
              ) : null}

              {step === "reset" || step === "done" ? (
                <div className="mt-8 space-y-5">
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
                        className="inline-flex size-8 items-center justify-center rounded-full text-brand-primary transition-colors hover:bg-brand-primary/10"
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
                        className="inline-flex size-8 items-center justify-center rounded-full text-brand-primary transition-colors hover:bg-brand-primary/10"
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
                    className="inline-flex h-14 w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-[18px] font-bold text-white shadow-[0_18px_32px_rgba(39,104,250,0.28)] transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={pending || step === "done"}
                    onClick={() => void handleResetPassword()}
                  >
                    {flow.resetPassword.isPending ? "提交中…" : step === "done" ? "已完成" : "完成"}
                  </button>
                </div>
              ) : null}

              {message ? (
                <p
                  className="mt-5 rounded-xl bg-[#FFF7E8] px-4 py-3 text-[14px] leading-relaxed text-[#B35A00]"
                  role="alert"
                >
                  {message}
                </p>
              ) : null}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
