import { useEffect, useState } from "react";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { validateEmailAddress, validateVerificationCode } from "@/lib/account-settings";
import { formatApiError } from "@/lib/formatApiError";

interface ChangeEmailSheetProps {
  open: boolean;
  currentEmail?: string;
  pending?: boolean;
  sendingCode?: boolean;
  onClose: () => void;
  onSendCode: (email: string) => Promise<void>;
  onSubmit: (params: { Email: string; Code: string }) => Promise<void>;
}

export function ChangeEmailSheet({
  open,
  currentEmail,
  pending = false,
  sendingCode = false,
  onClose,
  onSendCode,
  onSubmit,
}: ChangeEmailSheetProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setCode("");
      setError("");
      setCountdown(0);
      return;
    }
    if (currentEmail) setEmail(currentEmail);
  }, [open, currentEmail]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  if (!open) return null;

  async function handleSendCode() {
    const validation = validateEmailAddress(email);
    if (validation) {
      setError(validation);
      return;
    }
    setError("");
    try {
      await onSendCode(email.trim());
      setCountdown(60);
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function handleSubmit() {
    const emailError = validateEmailAddress(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    const codeError = validateVerificationCode(code);
    if (codeError) {
      setError(codeError);
      return;
    }
    setError("");
    try {
      await onSubmit({ Email: email.trim(), Code: code.trim() });
      onClose();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[70] flex flex-col justify-end bg-black/40 ${HOTEL_DETAIL_FONT}`}
    >
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div className="flex max-h-[85vh] flex-col rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between border-b border-[#eeeeee] px-4 py-3">
          <p className="text-[16px] font-semibold text-[#333333]">修改邮箱</p>
          <button
            type="button"
            className="text-[22px] leading-none text-[#999999]"
            aria-label="关闭"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="space-y-0 px-4 py-2">
          <label className="block border-b border-[#F0F2F5] py-3">
            <span className="mb-2 block text-[13px] text-[#666666]">邮箱地址</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border-none bg-transparent text-[16px] text-[#333333] outline-none"
              placeholder="请输入邮箱"
            />
          </label>
          <label className="block py-3">
            <span className="mb-2 block text-[13px] text-[#666666]">验证码</span>
            <div className="flex items-center gap-3">
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="min-w-0 flex-1 border-none bg-transparent text-[16px] text-[#333333] outline-none"
                placeholder="请输入验证码"
              />
              <button
                type="button"
                className="shrink-0 text-[14px] text-brand-primary disabled:text-[#999999]"
                disabled={countdown > 0 || sendingCode}
                onClick={() => void handleSendCode()}
              >
                {countdown > 0 ? `${countdown}s` : sendingCode ? "发送中…" : "获取验证码"}
              </button>
            </div>
          </label>
        </div>

        {error ? <p className="px-4 pt-1 text-[13px] text-destructive">{error}</p> : null}

        <div className="px-4 pt-4">
          <button
            type="button"
            className="h-11 w-full rounded-lg bg-brand-primary text-[16px] font-medium text-white disabled:opacity-60"
            disabled={pending}
            onClick={() => void handleSubmit()}
          >
            {pending ? "提交中…" : "确认修改"}
          </button>
        </div>
      </div>
    </div>
  );
}
