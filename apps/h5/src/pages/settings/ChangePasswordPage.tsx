import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { usePageHeader } from "@/components/layout";
import { SettingsPageChrome } from "@/components/settings/SettingsPageChrome";
import { useModifyPassword } from "@/hooks/useAccountSecurity";
import { validatePasswordChange } from "@/lib/account-settings";
import { formatApiError } from "@/lib/formatApiError";

function PasswordVisibilityToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
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
      aria-label={visible ? "隐藏密码" : "显示密码"}
      className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#8A94A6] transition-colors duration-200 hover:bg-[#EEF2F7] active:opacity-70"
      onClick={onToggle}
    >
      {visible ? (
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" aria-hidden>
          <path d={eyePath} {...stroke} />
          <circle cx="12" cy="12" r="2.5" {...stroke} />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" aria-hidden>
          <path d={eyePath} {...stroke} />
          <path d="M4 4l16 16" {...stroke} />
        </svg>
      )}
    </button>
  );
}

function PasswordRow({
  label,
  value,
  placeholder,
  onChange,
  autoComplete,
  borderless,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  borderless?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <label
      className={`flex items-center gap-3 px-4 py-3.5 transition-colors duration-200 ${
        borderless ? "" : "border-b border-[#EEF0F4]"
      } ${focused ? "bg-[#F8FAFD]" : ""}`}
    >
      <span className="w-[4.5rem] shrink-0 text-[15px] font-medium text-[#5C6678]">{label}</span>
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="min-w-0 flex-1 border-none bg-transparent text-[16px] text-[#1A1A1A] outline-none placeholder:text-[#C5C5D0]"
      />
      <PasswordVisibilityToggle visible={visible} onToggle={() => setVisible((v) => !v)} />
    </label>
  );
}

function RuleItem({ met, label }: { met: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-[12px] leading-snug">
      <span
        className={`flex size-4 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
          met ? "bg-[#E8F7EE] text-[#22A06B]" : "bg-[#EEF0F4] text-[#B0B8C5]"
        }`}
        aria-hidden
      >
        {met ? (
          <svg viewBox="0 0 12 12" className="size-2.5" fill="none">
            <path
              d="M2.5 6l2.5 2.5 4.5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <span className="size-1.5 rounded-full bg-current" />
        )}
      </span>
      <span className={met ? "text-[#22A06B]" : "text-[#8A94A6]"}>{label}</span>
    </li>
  );
}

function PasswordRules({ password }: { password: string }) {
  const rules = useMemo(
    () => ({
      length: password.length >= 8 && password.length <= 20,
      digit: /\d/.test(password),
      letter: /[a-zA-Z]/.test(password),
      noSpace: password.length === 0 || !/\s/.test(password),
    }),
    [password],
  );

  const metCount = Object.values(rules).filter(Boolean).length;

  return (
    <div className="rounded-xl border border-[#D6E8FF] bg-[#F5F9FF] px-4 py-3.5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-white text-brand-primary shadow-sm">
            <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden>
              <path
                d="M10 2.5 4 5v5c0 3.5 2.5 6 6 7.5 3.5-1.5 6-4 6-7.5V5l-6-2.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <p className="text-[13px] font-medium text-[#333333]">密码安全要求</p>
        </div>
        {password.length > 0 ? (
          <span className="text-[12px] text-[#8A94A6]">{metCount}/4</span>
        ) : null}
      </div>
      <ul className="grid grid-cols-2 gap-2">
        <RuleItem met={rules.length} label="8-20 位字符" />
        <RuleItem met={rules.digit} label="包含数字" />
        <RuleItem met={rules.letter} label="包含英文" />
        <RuleItem met={rules.noSpace} label="不含空格" />
      </ul>
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

export function ChangePasswordPage() {
  const navigate = useNavigate();
  usePageHeader({ visible: false });
  const modifyPassword = useModifyPassword();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const canSubmit =
    oldPassword.trim().length > 0 &&
    newPassword.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    !modifyPassword.isPending;

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  async function handleSubmit() {
    const validation = validatePasswordChange({ oldPassword, newPassword, confirmPassword });
    if (validation) {
      showToast(validation);
      return;
    }
    try {
      await modifyPassword.mutateAsync({
        OldPassword: oldPassword,
        NewPassword: newPassword,
        SurePassword: confirmPassword,
      });
      showToast("密码修改成功");
      window.setTimeout(() => {
        navigate("/settings/security", { replace: true });
      }, 600);
    } catch (err) {
      showToast(formatApiError(err));
    }
  }

  return (
    <SettingsPageChrome title="修改密码" backTo="/settings/security">
      <div className={`flex min-h-full flex-col ${HOTEL_DETAIL_FONT}`}>
        <div className="flex min-h-full flex-1 flex-col rounded-t-2xl bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
          <div className="px-1">
            <h2 className="text-[22px] font-bold leading-snug text-[#1A1A1A]">修改登录密码</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[#8A94A6]">
              为保障账户安全，请先验证原密码，再设置符合规则的新密码
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-xl border border-[#EEF0F4] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
            <PasswordRow
              label="原密码"
              value={oldPassword}
              placeholder="请填写原密码"
              onChange={setOldPassword}
              autoComplete="current-password"
            />
            <PasswordRow
              label="新密码"
              value={newPassword}
              placeholder="8-20位字符"
              onChange={setNewPassword}
              autoComplete="new-password"
            />
            <PasswordRow
              label="确认密码"
              value={confirmPassword}
              placeholder="再次输入新密码"
              onChange={setConfirmPassword}
              autoComplete="new-password"
              borderless
            />
          </div>

          <div className="mt-5">
            <PasswordRules password={newPassword} />
          </div>

          <div className="mt-10 px-1">
            <button
              type="button"
              className="flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-[17px] font-medium text-white shadow-[0_8px_20px_rgba(39,104,250,0.28)] transition-opacity duration-200 active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canSubmit}
              onClick={() => void handleSubmit()}
            >
              {modifyPassword.isPending ? "提交中…" : "确认修改"}
            </button>
          </div>
        </div>
      </div>

      {toast ? <PageToast message={toast} /> : null}
    </SettingsPageChrome>
  );
}
