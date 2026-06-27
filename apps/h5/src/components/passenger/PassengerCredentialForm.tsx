import { useState, type ReactNode } from "react";
import type { CredentialFormMode, CredentialFormValues } from "@ryx/shared-types";
import {
  CREDENTIAL_TYPE_LABELS,
  CredentialType,
  isIdCardType,
} from "@ryx/shared-types";

import { ClearableFieldInput, clearableFieldInputClass } from "@/components/form";
import { CredentialTypeSheet } from "./CredentialTypeSheet";
import { CredentialNameRulesSheet } from "./CredentialNameRulesSheet";
import { normalizeCredentialName, detectIdCardGender } from "@/lib/credential-name";

interface PassengerCredentialFormProps {
  mode: CredentialFormMode;
  values: CredentialFormValues;
  onChange: (values: CredentialFormValues) => void;
  error?: string;
  fixedName?: string;
}

function FormRow({
  label,
  children,
  divider = true,
  onClick,
}: {
  label: string;
  children: ReactNode;
  divider?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <div
      className={`flex min-h-[52px] items-center gap-3 px-4 ${divider ? "border-b border-[#eeeeee]" : ""}`}
    >
      <span className="shrink-0 text-sm text-[#333333]">{label}</span>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">{children}</div>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" className="block w-full text-left active:bg-[#fafafa]" onClick={onClick}>
        {content}
      </button>
    );
  }

  return content;
}

function ChevronRight() {
  return (
    <span className="shrink-0 text-sm text-[#cccccc]" aria-hidden>
      ›
    </span>
  );
}

/** Combined hint section — name rules link + privacy policy, both open modals. */
function FormHintSection({ onOpenNameRules }: { onOpenNameRules: () => void }) {
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <>
      <div className="mt-3 space-y-1.5 px-1">
        <p className="text-xs leading-relaxed text-[#999999]">
          输入姓名需与证件一致，详请见
          <button
            type="button"
            className="text-[#5099fe] underline underline-offset-2"
            onClick={onOpenNameRules}
          >
            姓名填写规则
          </button>
        </p>
        <p className="text-xs leading-relaxed text-[#999999]">
          点击保存即表示您已阅读并接受
          <button
            type="button"
            className="text-[#5099fe] underline underline-offset-2"
            onClick={() => setPrivacyOpen(true)}
          >
            个人信息授权声明
          </button>
        </p>
      </div>

      {privacyOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-6"
          role="presentation"
          onClick={() => setPrivacyOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-dialog-title"
            className="flex max-h-[min(80vh,480px)] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 px-5 pb-3 pt-5">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#eeeeee]" aria-hidden />
                <div className="shrink-0 text-center">
                  <h2 id="privacy-dialog-title" className="text-base font-semibold text-[#333333]">
                    个人信息授权声明
                  </h2>
                  <div className="mx-auto mt-1.5 h-0.5 w-10 rounded-full bg-gradient-to-r from-brand-btn-start to-brand-btn-end" aria-hidden />
                </div>
                <div className="h-px flex-1 bg-[#eeeeee]" aria-hidden />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 text-sm leading-relaxed text-[#666666]">
              <p>
                您授权我们在为您提供差旅服务的过程中，收集、存储、使用您的个人信息（包括但不限于姓名、证件类型、证件号码、手机号码、出生日期等），并共享给出差申请/审批流程中的相关人员及为您提供差旅服务的供应商。我们将采取必要的技术和管理措施保障您的个人信息安全。
              </p>
            </div>

            <div className="shrink-0 px-5 pb-5">
              <button
                type="button"
                className="flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-sm font-medium text-white active:opacity-90"
                onClick={() => setPrivacyOpen(false)}
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function PassengerCredentialForm({
  mode,
  values,
  onChange,
  error,
  fixedName,
}: PassengerCredentialFormProps) {
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);
  const [nameRulesOpen, setNameRulesOpen] = useState(false);
  const showExtra = !isIdCardType(values.Type);
  const requireMobile = mode === "external";
  const isPassport = values.Type === CredentialType.Passport;
  const showPassportEnglish = isPassport && values.Surname !== undefined;
  const isFixedNameMode = Boolean(fixedName);

  function patch(partial: Partial<CredentialFormValues>) {
    onChange({ ...values, ...partial });
  }

  function handleNameChange(raw: string) {
    if (isFixedNameMode) return;
    onChange({ ...values, Name: normalizeCredentialName(raw) });
  }

  function handleNumberChange(raw: string) {
    const next = { ...values, Number: raw };
    // Auto-detect gender from ID card number
    if (raw.length >= 17 && !values.Gender) {
      const detectedGender = detectIdCardGender(raw);
      if (detectedGender) {
        next.Gender = detectedGender;
      }
    }
    onChange(next);
  }

  function handleTypeChange(type: number) {
    const prevType = values.Type;
    const next: CredentialFormValues = { ...values, Type: type };
    // Reset passport english fields when switching away from passport
    if (prevType === CredentialType.Passport && type !== CredentialType.Passport) {
      delete next.Surname;
      delete next.Givenname;
    }
    onChange(next);
    setTypeSheetOpen(false);
  }

  function handleSurnameChange(surname: string) {
    const givenname = values.Givenname ?? "";
    const combined = `${surname} ${givenname}`.trim();
    onChange({ ...values, Surname: surname, Name: combined });
  }

  function handleGivennameChange(givenname: string) {
    const surname = values.Surname ?? "";
    const combined = `${surname} ${givenname}`.trim();
    onChange({ ...values, Givenname: givenname, Name: combined });
  }

  return (
    <>
      <div className="px-4 pt-2">
        {error ? (
          <p className="mb-3 text-sm text-[#ff4d4f]" role="alert">
            {error}
          </p>
        ) : null}

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          {isPassport ? (
            <>
              {/* Passport name mode toggle */}
              <FormRow label="姓名模式">
                <div className="inline-flex rounded-full bg-[#F5F6F9] p-0.5">
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      !showPassportEnglish ? "bg-white text-[#5099fe] shadow-sm" : "text-[#999999]"
                    }`}
                    onClick={() => patch({ Surname: undefined, Givenname: undefined })}
                  >
                    中文
                  </button>
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      showPassportEnglish ? "bg-white text-[#5099fe] shadow-sm" : "text-[#999999]"
                    }`}
                    onClick={() => patch({ Surname: values.Surname ?? "", Givenname: values.Givenname ?? "" })}
                  >
                    英文
                  </button>
                </div>
              </FormRow>

              {showPassportEnglish ? (
                <>
                  <FormRow label="姓 (Surname)">
                    <ClearableFieldInput
                      value={values.Surname ?? ""}
                      placeholder="请输入英文姓"
                      onChange={(e) => handleSurnameChange(e.target.value)}
                      onClear={() => handleSurnameChange("")}
                    />
                  </FormRow>
                  <FormRow label="名 (Givenname)">
                    <ClearableFieldInput
                      value={values.Givenname ?? ""}
                      placeholder="请输入英文名"
                      onChange={(e) => handleGivennameChange(e.target.value)}
                      onClear={() => handleGivennameChange("")}
                    />
                  </FormRow>
                  {/* Show computed full name */}
                  <FormRow label="全名" divider>
                    <span className="text-sm text-[#333333]">{values.Name}</span>
                  </FormRow>
                </>
              ) : (
                <FormRow label="姓名">
                  {isFixedNameMode ? (
                    <span className="text-sm text-[#333333]">{fixedName}</span>
                  ) : (
                    <ClearableFieldInput
                      value={values.Name}
                      placeholder="输入姓名（与证件一致）"
                      onChange={(e) => handleNameChange(e.target.value)}
                      onClear={() => handleNameChange("")}
                    />
                  )}
                </FormRow>
              )}
            </>
          ) : (
            <FormRow label="姓名">
              {isFixedNameMode ? (
                <span className="text-sm text-[#333333]">{fixedName}</span>
              ) : (
                <ClearableFieldInput
                  value={values.Name}
                  placeholder="输入姓名（与证件一致）"
                  onChange={(e) => handleNameChange(e.target.value)}
                  onClear={() => handleNameChange("")}
                />
              )}
            </FormRow>
          )}

          <FormRow label="证件类型" onClick={() => setTypeSheetOpen(true)}>
            <span className="text-sm text-[#666666]">{CREDENTIAL_TYPE_LABELS[values.Type]}</span>
            <ChevronRight />
          </FormRow>

          <FormRow label="证件号码">
            <ClearableFieldInput
              value={values.Number}
              placeholder="请输入证件号码"
              onChange={(e) => handleNumberChange(e.target.value)}
              onClear={() => patch({ Number: "" })}
            />
          </FormRow>

          {requireMobile ? (
            <FormRow label="手机号码" divider={showExtra}>
              <ClearableFieldInput
                type="tel"
                inputMode="tel"
                value={values.Mobile ?? ""}
                placeholder="请输入手机号码"
                onChange={(e) => patch({ Mobile: e.target.value })}
                onClear={() => patch({ Mobile: "" })}
              />
            </FormRow>
          ) : null}

          {showExtra ? (
            <>
              <FormRow label="出生日期">
                <ClearableFieldInput
                  type="date"
                  value={values.Birthday ?? ""}
                  onChange={(e) => patch({ Birthday: e.target.value })}
                  onClear={() => patch({ Birthday: "" })}
                />
              </FormRow>
              <FormRow label="证件有效期">
                <ClearableFieldInput
                  type="date"
                  value={values.ExpirationDate ?? ""}
                  onChange={(e) => patch({ ExpirationDate: e.target.value })}
                  onClear={() => patch({ ExpirationDate: "" })}
                />
              </FormRow>
              <FormRow label="性别" divider={false}>
                <select
                  className={`${clearableFieldInputClass} appearance-none`}
                  value={values.Gender ?? "M"}
                  onChange={(e) => patch({ Gender: e.target.value })}
                >
                  <option value="M">男</option>
                  <option value="F">女</option>
                </select>
                <ChevronRight />
              </FormRow>
            </>
          ) : null}
        </div>

        {/* Hints — name rules + privacy policy */}
        <FormHintSection onOpenNameRules={() => setNameRulesOpen(true)} />
      </div>

      <CredentialTypeSheet
        open={typeSheetOpen}
        value={values.Type}
        onClose={() => setTypeSheetOpen(false)}
        onSelect={handleTypeChange}
      />

      <CredentialNameRulesSheet open={nameRulesOpen} onClose={() => setNameRulesOpen(false)} />
    </>
  );
}
