import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CredentialFormMode, CredentialFormValues } from "@ryx/shared-types";
import { CREDENTIAL_TYPE_LABELS, CredentialType, isIdCardType } from "@ryx/shared-types";

import { ClearFieldButton, ClearableFieldInput } from "@/components/form";
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
      <button
        type="button"
        className="block w-full text-left active:bg-[#fafafa]"
        onClick={onClick}
      >
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

function SelectedCheckIcon() {
  return (
    <span className="text-[#5099fe]" aria-hidden>
      ✓
    </span>
  );
}

function SheetCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="flex size-8 items-center justify-center rounded-full bg-[#F5F6F9] text-[#999999] active:bg-[#EBEDF0]"
      aria-label="关闭"
      onClick={onClose}
    >
      <svg
        viewBox="0 0 20 20"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function GenderSheet({
  open,
  value,
  onClose,
  onSelect,
}: {
  open: boolean;
  value: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  if (!open) return null;

  const options = [
    { value: "M", label: "男" },
    { value: "F", label: "女" },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div className="max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <h2 className="mb-4 text-center text-base font-semibold text-[#333333]">性别</h2>
        <ul className="divide-y divide-[#eeeeee]">
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-4 text-left text-sm active:bg-[#f5f7fa]"
                  onClick={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                >
                  <span className={selected ? "font-medium text-[#5099fe]" : "text-[#333333]"}>
                    {option.label}
                  </span>
                  {selected ? <SelectedCheckIcon /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function parseDateParts(value?: string): { year: number; month: number; day: number } | null {
  const matched = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return null;
  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDateParts(year: number, month: number, day: number): string {
  return `${year}-${padDatePart(month)}-${padDatePart(day)}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function range(start: number, end: number): number[] {
  const result: number[] = [];
  for (let value = start; value <= end; value += 1) {
    result.push(value);
  }
  return result;
}

function DateColumn({
  label,
  values,
  selected,
  suffix,
  onSelect,
}: {
  label: string;
  values: number[];
  selected: number;
  suffix: string;
  onSelect: (value: number) => void;
}) {
  const selectedRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "center" });
  }, [selected, values]);

  return (
    <div className="min-w-0 flex-1">
      <p className="mb-2 text-center text-xs text-[#999999]">{label}</p>
      <div className="max-h-48 overflow-y-auto rounded-xl bg-[#F7F8FA] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {values.map((value) => {
          const active = value === selected;
          return (
            <button
              key={value}
              ref={active ? selectedRef : undefined}
              type="button"
              className={`flex h-10 w-full items-center justify-center rounded-lg text-sm transition-colors active:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 ${
                active ? "bg-white font-medium text-[#5099fe] shadow-sm" : "text-[#666666]"
              }`}
              onClick={() => onSelect(value)}
            >
              {value}
              {suffix}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CredentialDateSheet({
  open,
  title,
  value,
  minYear,
  maxYear,
  fallbackYear,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  value?: string;
  minYear: number;
  maxYear: number;
  fallbackYear: number;
  onClose: () => void;
  onConfirm: (value: string) => void;
}) {
  const currentParts = parseDateParts(value) ?? {
    year: Math.min(Math.max(fallbackYear, minYear), maxYear),
    month: 1,
    day: 1,
  };
  const [year, setYear] = useState(currentParts.year);
  const [month, setMonth] = useState(currentParts.month);
  const [day, setDay] = useState(currentParts.day);

  const years = useMemo(() => range(minYear, maxYear), [minYear, maxYear]);
  const months = useMemo(() => range(1, 12), []);
  const days = useMemo(() => range(1, daysInMonth(year, month)), [year, month]);
  const safeDay = Math.min(day, days.length);

  useEffect(() => {
    if (!open) return;
    const nextParts = parseDateParts(value) ?? {
      year: Math.min(Math.max(fallbackYear, minYear), maxYear),
      month: 1,
      day: 1,
    };
    setYear(nextParts.year);
    setMonth(nextParts.month);
    setDay(nextParts.day);
  }, [fallbackYear, maxYear, minYear, open, value]);

  if (!open) return null;

  function confirm() {
    onConfirm(formatDateParts(year, month, safeDay));
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end bg-black/45">
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div
        className="rounded-t-[20px] bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-10px_40px_rgba(0,0,0,0.12)]"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex justify-center pb-2" aria-hidden>
          <span className="h-1 w-9 rounded-full bg-[#E0E0E0]" />
        </div>
        <div className="relative flex items-center justify-center pb-4">
          <h2 className="text-base font-semibold text-[#333333]">{title}</h2>
          <div className="absolute right-0 top-[-4px]">
            <SheetCloseButton onClose={onClose} />
          </div>
        </div>

        <div className="flex gap-2">
          <DateColumn label="年份" values={years} selected={year} suffix="年" onSelect={setYear} />
          <DateColumn
            label="月份"
            values={months}
            selected={month}
            suffix="月"
            onSelect={setMonth}
          />
          <DateColumn label="日期" values={days} selected={safeDay} suffix="日" onSelect={setDay} />
        </div>

        <button
          type="button"
          className="mt-4 flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-sm font-medium text-white active:opacity-90"
          onClick={confirm}
        >
          确定
        </button>
      </div>
    </div>
  );
}

function DateValueRow({
  label,
  value,
  placeholder,
  divider = true,
  onOpen,
  onClear,
}: {
  label: string;
  value?: string;
  placeholder: string;
  divider?: boolean;
  onOpen: () => void;
  onClear: () => void;
}) {
  return (
    <div className={divider ? "border-b border-[#eeeeee]" : ""}>
      <div className="flex min-h-[52px] items-center gap-2 px-4">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
          onClick={onOpen}
        >
          <span className="shrink-0 text-sm text-[#333333]">{label}</span>
          <span
            className={`min-w-0 flex-1 text-right text-sm ${value ? "text-[#666666]" : "text-[#bbbbbb]"}`}
          >
            {value || placeholder}
          </span>
        </button>
        {value ? <ClearFieldButton onClear={onClear} /> : null}
        <button
          type="button"
          className="flex h-8 w-4 shrink-0 items-center justify-end active:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
          aria-label={`选择${label}`}
          onClick={onOpen}
        >
          <ChevronRight />
        </button>
      </div>
    </div>
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
                  <div
                    className="mx-auto mt-1.5 h-0.5 w-10 rounded-full bg-gradient-to-r from-brand-btn-start to-brand-btn-end"
                    aria-hidden
                  />
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
  const [genderSheetOpen, setGenderSheetOpen] = useState(false);
  const [dateSheet, setDateSheet] = useState<"birthday" | "expiration" | null>(null);
  const [nameRulesOpen, setNameRulesOpen] = useState(false);
  const showExtra = !isIdCardType(values.Type);
  const requireMobile = mode === "external";
  const isPassport = values.Type === CredentialType.Passport;
  const showPassportEnglish = isPassport && values.Surname !== undefined;
  const isFixedNameMode = Boolean(fixedName);
  const currentYear = new Date().getFullYear();

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
                    onClick={() =>
                      patch({ Surname: values.Surname ?? "", Givenname: values.Givenname ?? "" })
                    }
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
              <DateValueRow
                label="出生日期"
                value={values.Birthday}
                placeholder="请选择出生日期"
                onOpen={() => setDateSheet("birthday")}
                onClear={() => patch({ Birthday: "" })}
              />
              <DateValueRow
                label="证件有效期"
                value={values.ExpirationDate}
                placeholder="请选择证件有效期"
                onOpen={() => setDateSheet("expiration")}
                onClear={() => patch({ ExpirationDate: "" })}
              />
              <FormRow label="性别" divider={false} onClick={() => setGenderSheetOpen(true)}>
                <span className="text-sm text-[#666666]">
                  {values.Gender === "F" ? "女" : "男"}
                </span>
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

      <GenderSheet
        open={genderSheetOpen}
        value={values.Gender ?? "M"}
        onClose={() => setGenderSheetOpen(false)}
        onSelect={(gender) => patch({ Gender: gender })}
      />

      <CredentialDateSheet
        open={dateSheet === "birthday"}
        title="选择出生日期"
        value={values.Birthday}
        minYear={1900}
        maxYear={currentYear}
        fallbackYear={1990}
        onClose={() => setDateSheet(null)}
        onConfirm={(Birthday) => patch({ Birthday })}
      />

      <CredentialDateSheet
        open={dateSheet === "expiration"}
        title="选择证件有效期"
        value={values.ExpirationDate}
        minYear={currentYear}
        maxYear={currentYear + 30}
        fallbackYear={currentYear + 10}
        onClose={() => setDateSheet(null)}
        onConfirm={(ExpirationDate) => patch({ ExpirationDate })}
      />

      <CredentialNameRulesSheet open={nameRulesOpen} onClose={() => setNameRulesOpen(false)} />
    </>
  );
}
