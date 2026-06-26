import type { ReactNode } from "react";
import type { FlightOutNumberField } from "@ryx/shared-types";

import { HotelBookTravelFields } from "@/components/hotel/HotelBookTravelFields";
import { BookContactCheckboxMark } from "@/components/book/BookContactCheckbox";
import type { HotelPassengerBookForm } from "@/lib/hotel-book";

export type BookPassengerDetailsForm = Omit<HotelPassengerBookForm, "arrivalTime">;

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg bg-white ring-1 ring-[#EEF1F6]">
      <div className="flex items-center gap-2 border-b border-[#F0F2F5] bg-[#FAFBFC] px-3 py-2">
        <span className="h-3 w-[3px] shrink-0 rounded-full bg-[#2768FA]" aria-hidden />
        <h4 className="text-[13px] font-medium leading-none text-[#333333]">{title}</h4>
      </div>
      <div className="px-3">{children}</div>
    </section>
  );
}

function DetailRow({
  label,
  children,
  action,
}: {
  label: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[2.75rem] items-center gap-2 border-b border-[#f0f0f0] py-2.5 last:border-b-0">
      <span className="w-[5.75rem] shrink-0 whitespace-nowrap text-[14px] leading-none text-[#666666]">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

const detailValueClass =
  "w-full min-w-0 bg-transparent text-right text-[14px] leading-tight text-[#333333] outline-none placeholder:text-[#cccccc]";
const detailActionClass =
  "flex w-full min-w-0 items-center justify-end gap-1 truncate text-[14px] leading-tight text-[#333333] disabled:text-[#cccccc]";

const emptyOrgCost = { code: "", name: "" };

function ContactCheckboxList({
  options,
  onChange,
}: {
  options: BookPassengerDetailsForm["mobileOptions"];
  onChange: (next: BookPassengerDetailsForm["mobileOptions"]) => void;
}) {
  if (!options.length) {
    return <p className="text-right text-[14px] text-[#999999]">暂无</p>;
  }

  return (
    <div className="space-y-2">
      {options.map((option, index) => (
        <label
          key={`${option.value}-${index}`}
          className="flex cursor-pointer items-center justify-end gap-2 text-[14px] leading-tight text-[#333333]"
        >
          <span className="truncate">{option.value}</span>
          <input
            type="checkbox"
            checked={option.checked}
            onChange={(event) => {
              const next = options.map((item, idx) =>
                idx === index ? { ...item, checked: event.target.checked } : item,
              );
              onChange(next);
            }}
            className="sr-only"
          />
          <BookContactCheckboxMark checked={option.checked} />
        </label>
      ))}
    </div>
  );
}

function formatCostCenterDisplay(costCenter: BookPassengerDetailsForm["costCenter"]): string {
  if (costCenter.code && costCenter.name) {
    return `${costCenter.code}-${costCenter.name}`;
  }
  return costCenter.name || costCenter.code || "请选择";
}

function hasOtherCostCenterInput(form: BookPassengerDetailsForm): boolean {
  return Boolean(form.otherCostCenterName.trim() || form.otherCostCenterCode.trim());
}

function hasOtherOrganizationInput(form: BookPassengerDetailsForm): boolean {
  return Boolean(form.otherOrganizationName.trim());
}

interface HotelBookPassengerDetailsProps {
  form: BookPassengerDetailsForm;
  showOrganizations: boolean;
  showCostCenter: boolean;
  requiresApprover: boolean;
  isSkipApproveEnabled: boolean;
  outNumberFields: FlightOutNumberField[];
  illegalReasons: string[];
  expenseTypes: { id: string; name: string }[];
  requiresIllegalReason: boolean;
  onUpdateForm: (patch: Partial<BookPassengerDetailsForm>) => void;
  onOpenOrganization: () => void;
  onOpenCostCenter: () => void;
  onOpenApprover: () => void;
  onOpenOutNumberPicker: (field: FlightOutNumberField) => void;
}

export function HotelBookPassengerDetails({
  form,
  showOrganizations,
  showCostCenter,
  requiresApprover,
  isSkipApproveEnabled,
  outNumberFields,
  illegalReasons,
  expenseTypes,
  requiresIllegalReason,
  onUpdateForm,
  onOpenOrganization,
  onOpenCostCenter,
  onOpenApprover,
  onOpenOutNumberPicker,
}: HotelBookPassengerDetailsProps) {
  const hasOrgSection = showOrganizations || showCostCenter;
  const showTravelFields =
    illegalReasons.length > 0 || requiresIllegalReason || expenseTypes.length > 0;

  return (
    <>
      <DetailSection title="联系方式">
        <DetailRow label="联系电话">
          <ContactCheckboxList
            options={form.mobileOptions}
            onChange={(mobileOptions) => onUpdateForm({ mobileOptions })}
          />
        </DetailRow>

        <DetailRow label="联系邮箱">
          <ContactCheckboxList
            options={form.emailOptions}
            onChange={(emailOptions) => onUpdateForm({ emailOptions })}
          />
        </DetailRow>
      </DetailSection>

      {hasOrgSection ? (
        <DetailSection title="组织信息">
          {showOrganizations ? (
            <DetailRow label="部门">
              <button
                type="button"
                className={detailActionClass}
                disabled={hasOtherOrganizationInput(form)}
                onClick={onOpenOrganization}
              >
                <span className="truncate">
                  {hasOtherOrganizationInput(form)
                    ? "已填写其他部门"
                    : form.organization.name || "请选择"}
                </span>
                <span className="shrink-0 text-[16px] text-[#bbbbbb]" aria-hidden>
                  ›
                </span>
              </button>
            </DetailRow>
          ) : null}

          {showCostCenter ? (
            <DetailRow label="成本中心">
              <button
                type="button"
                className={detailActionClass}
                disabled={hasOtherCostCenterInput(form)}
                onClick={onOpenCostCenter}
              >
                <span className="truncate">
                  {hasOtherCostCenterInput(form)
                    ? "已填写其他成本中心"
                    : formatCostCenterDisplay(form.costCenter)}
                </span>
                <span className="shrink-0 text-[16px] text-[#bbbbbb]" aria-hidden>
                  ›
                </span>
              </button>
            </DetailRow>
          ) : null}
        </DetailSection>
      ) : null}

      <DetailSection title="补充信息">
        <DetailRow label="其他电话">
          <input
            type="tel"
            value={form.otherMobile}
            placeholder="请输入"
            onChange={(event) => onUpdateForm({ otherMobile: event.target.value })}
            className={detailValueClass}
          />
        </DetailRow>

        <DetailRow label="其他邮箱">
          <input
            type="email"
            value={form.otherEmail}
            placeholder="请输入"
            onChange={(event) => onUpdateForm({ otherEmail: event.target.value })}
            className={detailValueClass}
          />
        </DetailRow>

        {showOrganizations ? (
          <DetailRow label="其他部门">
            <input
              type="text"
              value={form.otherOrganizationName}
              placeholder="请输入名称"
              onChange={(event) => {
                const value = event.target.value;
                onUpdateForm({
                  otherOrganizationName: value,
                  ...(value.trim() ? { organization: emptyOrgCost } : {}),
                });
              }}
              className={detailValueClass}
            />
          </DetailRow>
        ) : null}

        {showCostCenter ? (
          <>
            <DetailRow label="其他成本中心名称">
              <input
                type="text"
                value={form.otherCostCenterName}
                placeholder="请输入名称"
                onChange={(event) => {
                  const value = event.target.value;
                  onUpdateForm({
                    otherCostCenterName: value,
                    ...(value.trim() ? { costCenter: emptyOrgCost } : {}),
                  });
                }}
                className={detailValueClass}
              />
            </DetailRow>
            <DetailRow label="其他成本中心代码">
              <input
                type="text"
                value={form.otherCostCenterCode}
                placeholder="请输入代码"
                onChange={(event) => {
                  const value = event.target.value;
                  onUpdateForm({
                    otherCostCenterCode: value,
                    ...(value.trim() ? { costCenter: emptyOrgCost } : {}),
                  });
                }}
                className={detailValueClass}
              />
            </DetailRow>
          </>
        ) : null}

        {outNumberFields.map((field) =>
          field.canSelect ? (
            <DetailRow key={field.key} label={field.label}>
              <button
                type="button"
                className={detailActionClass}
                onClick={() => onOpenOutNumberPicker(field)}
              >
                <span className="truncate">
                  {form.outNumbers[field.key] ?? field.value ?? "请选择"}
                </span>
                <span className="shrink-0 text-[16px] text-[#bbbbbb]" aria-hidden>
                  ›
                </span>
              </button>
            </DetailRow>
          ) : (
            <DetailRow key={field.key} label={field.label}>
              <input
                type="text"
                value={form.outNumbers[field.key] ?? field.value ?? ""}
                placeholder="请输入"
                onChange={(event) =>
                  onUpdateForm({
                    outNumbers: {
                      ...form.outNumbers,
                      [field.key]: event.target.value,
                    },
                  })
                }
                className={detailValueClass}
              />
            </DetailRow>
          ),
        )}

        <DetailRow label="同住人">
          <input
            type="text"
            value={form.roommate}
            placeholder="请输入"
            onChange={(event) => onUpdateForm({ roommate: event.target.value })}
            className={detailValueClass}
          />
        </DetailRow>
      </DetailSection>

      {requiresApprover ? (
        <DetailSection title="审批信息">
          <DetailRow label="审批人">
            <button type="button" className={detailActionClass} onClick={onOpenApprover}>
              <span className="truncate">{form.approvalName || "请选择"}</span>
              <span className="shrink-0 text-[16px] text-[#bbbbbb]" aria-hidden>
                ›
              </span>
            </button>
          </DetailRow>

          {isSkipApproveEnabled ? (
            <label className="flex items-center justify-end gap-2 border-b border-[#f0f0f0] py-2.5 text-[13px] text-[#666666] last:border-b-0">
              <span>跳过审批</span>
              <input
                type="checkbox"
                checked={form.isSkipApprove}
                onChange={(event) => onUpdateForm({ isSkipApprove: event.target.checked })}
                className="size-4 accent-[#2768FA]"
              />
            </label>
          ) : null}
        </DetailSection>
      ) : null}

      {showTravelFields ? (
        <DetailSection title="差旅信息">
          <HotelBookTravelFields
            illegalReasons={illegalReasons}
            expenseTypes={expenseTypes}
            illegalReason={form.illegalReason}
            otherIllegalReason={form.otherIllegalReason}
            expenseTypeId={form.expenseTypeId}
            requireIllegalReason={requiresIllegalReason}
            onIllegalReasonChange={(value) => onUpdateForm({ illegalReason: value })}
            onOtherIllegalReasonChange={(value) => onUpdateForm({ otherIllegalReason: value })}
            onExpenseTypeChange={(value) => onUpdateForm({ expenseTypeId: value })}
            embedded
          />
        </DetailSection>
      ) : null}
    </>
  );
}
