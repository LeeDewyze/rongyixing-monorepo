import { useState, type ReactNode } from "react";
import type { CredentialFormMode, CredentialFormValues } from "@ryx/shared-types";
import {
  CREDENTIAL_TYPE_LABELS,
  isIdCardType,
} from "@ryx/shared-types";

import { ClearableFieldInput, clearableFieldInputClass } from "@/components/form";
import { CredentialTypeSheet } from "./CredentialTypeSheet";
import { CredentialNameRulesSheet } from "./CredentialNameRulesSheet";
import { normalizeCredentialName } from "@/lib/credential-name";

interface PassengerCredentialFormProps {
  mode: CredentialFormMode;
  values: CredentialFormValues;
  onChange: (values: CredentialFormValues) => void;
  error?: string;
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

export function PassengerCredentialForm({
  mode,
  values,
  onChange,
  error,
}: PassengerCredentialFormProps) {
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);
  const [nameRulesOpen, setNameRulesOpen] = useState(false);
  const showExtra = !isIdCardType(values.Type);
  const requireMobile = mode === "external";

  function patch(partial: Partial<CredentialFormValues>) {
    onChange({ ...values, ...partial });
  }

  function handleNameChange(raw: string) {
    patch({ Name: normalizeCredentialName(raw) });
  }

  return (
    <>
      <div className="px-4 pt-2">
        {error ? (
          <p className="mb-3 text-sm text-[#ff4d4f]" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          className="mb-3 flex w-full items-center gap-2 rounded-xl bg-white px-4 py-3 text-left shadow-sm active:bg-[#fafafa]"
          onClick={() => setNameRulesOpen(true)}
          aria-label="查看姓名填写规则"
        >
          <p className="flex-1 whitespace-nowrap text-sm text-[#666666]">
            <span className="text-[#333333]">提示：</span>
            姓名需要与乘机证件一致。
          </p>
          <ChevronRight />
        </button>

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <FormRow label="姓名">
            <ClearableFieldInput
              value={values.Name}
              placeholder="请输入姓名"
              onChange={(e) => handleNameChange(e.target.value)}
              onClear={() => handleNameChange("")}
            />
          </FormRow>

          <FormRow label="证件类型" onClick={() => setTypeSheetOpen(true)}>
            <span className="text-sm text-[#666666]">{CREDENTIAL_TYPE_LABELS[values.Type]}</span>
            <ChevronRight />
          </FormRow>

          <FormRow label="证件号码">
            <ClearableFieldInput
              value={values.Number}
              placeholder="请输入证件号码"
              onChange={(e) => patch({ Number: e.target.value })}
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
      </div>

      <CredentialTypeSheet
        open={typeSheetOpen}
        value={values.Type}
        onClose={() => setTypeSheetOpen(false)}
        onSelect={(type) => patch({ Type: type })}
      />

      <CredentialNameRulesSheet open={nameRulesOpen} onClose={() => setNameRulesOpen(false)} />
    </>
  );
}
