import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import {
  ProductType,
  credentialDisplayNumber,
  credentialDisplayType,
  type FlightPassengerBookForm,
  type PassengerBookInfo,
} from "@ryx/shared-types";

import {
  FlightBookCredentialSwitchButton,
  FlightBookExpandableSummaryCard,
} from "@/components/flight/FlightBookExpandableSummaryCard";
import { BookContactCheckboxMark } from "@/components/book/BookContactCheckbox";
import { buildPassengerSelectPath } from "@/lib/passenger-selection";

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
    <div className="flex min-h-[2.5rem] items-center gap-2 border-b border-[#f0f0f0] py-2 last:border-b-0">
      <span className="w-[5.5rem] shrink-0 whitespace-nowrap text-[14px] leading-none text-[#666666]">
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

function ContactCheckboxList({
  options,
  onChange,
  readOnly = false,
}: {
  options: FlightPassengerBookForm["mobileOptions"];
  onChange: (next: FlightPassengerBookForm["mobileOptions"]) => void;
  readOnly?: boolean;
}) {
  if (!options.length) {
    return <p className="text-right text-[14px] text-[#999999]">暂无</p>;
  }

  if (readOnly) {
    const checked = options.filter((option) => option.checked).map((option) => option.value);
    return (
      <p className="text-right text-[14px] leading-tight text-[#333333]">
        {(checked.length ? checked : options.map((option) => option.value)).join("，")}
      </p>
    );
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

const emptyOrgCost = { code: "", name: "" };

function formatCostCenterDisplay(costCenter: FlightPassengerBookForm["costCenter"]): string {
  if (costCenter.code && costCenter.name) {
    return `${costCenter.code}-${costCenter.name}`;
  }
  return costCenter.name || costCenter.code || "请选择";
}

function hasOtherCostCenterInput(form: FlightPassengerBookForm): boolean {
  return Boolean(form.otherCostCenterName.trim() || form.otherCostCenterCode.trim());
}

function hasOtherOrganizationInput(form: FlightPassengerBookForm): boolean {
  return Boolean(form.otherOrganizationName.trim());
}

function resolveStaffAccountId(passenger: PassengerBookInfo): string | undefined {
  const fromPassenger =
    "AccountId" in passenger.passenger ? passenger.passenger.AccountId : undefined;
  if (fromPassenger) return String(fromPassenger);
  return passenger.credential.AccountId ? String(passenger.credential.AccountId) : undefined;
}

function ReadOnlyDetailText({ value }: { value?: string }) {
  const text = value?.trim();
  return (
    <p
      className={
        text ? "text-right text-[14px] text-[#333333]" : "text-right text-[14px] text-[#999999]"
      }
    >
      {text || "暂无"}
    </p>
  );
}

interface FlightBookPassengerCardProps {
  passenger: PassengerBookInfo;
  form: FlightPassengerBookForm;
  showOrganizations: boolean;
  showCostCenter: boolean;
  readOnly?: boolean;
  onRemove?: (passenger: PassengerBookInfo) => void;
  onUpdateForm: (passengerId: string, patch: Partial<FlightPassengerBookForm>) => void;
  onOpenOrganization: (passengerId: string) => void;
  onOpenCostCenter: (passengerId: string) => void;
  onChangeCredential?: (passenger: PassengerBookInfo) => void;
}

export function FlightBookPassengerCard({
  passenger,
  form,
  showOrganizations,
  showCostCenter,
  readOnly = false,
  onRemove,
  onUpdateForm,
  onOpenOrganization,
  onOpenCostCenter,
  onChangeCredential,
}: FlightBookPassengerCardProps) {
  const canSwitchCredential =
    !readOnly && Boolean(resolveStaffAccountId(passenger)) && Boolean(onChangeCredential);
  const credentialLine = `${credentialDisplayType(passenger.credential)}：${credentialDisplayNumber(passenger.credential)}`;
  const footerAction =
    canSwitchCredential || onRemove ? (
      <div className="flex shrink-0 items-center gap-2">
        {canSwitchCredential ? (
          <FlightBookCredentialSwitchButton onClick={() => onChangeCredential?.(passenger)} />
        ) : null}
        {!readOnly && onRemove ? (
          <button
            type="button"
            className="rounded-full px-1.5 py-0.5 text-[12px] font-medium text-[#FF4D4F] active:bg-[#fff1f0]"
            onClick={() => onRemove(passenger)}
          >
            移除
          </button>
        ) : null}
      </div>
    ) : null;

  return (
    <FlightBookExpandableSummaryCard
      surface="plain"
      className="overflow-hidden rounded-xl ring-1 ring-[#EEF1F6]"
      name={passenger.credential.Name ?? ""}
      subtitle={credentialLine}
      expanded={form.expanded}
      onToggleExpanded={() => onUpdateForm(passenger.id, { expanded: !form.expanded })}
      footerAction={footerAction}
    >
      <DetailRow label="联系电话">
        <ContactCheckboxList
          options={form.mobileOptions}
          onChange={(mobileOptions) => onUpdateForm(passenger.id, { mobileOptions })}
          readOnly={readOnly}
        />
      </DetailRow>

      <DetailRow label="联系邮箱">
        <ContactCheckboxList
          options={form.emailOptions}
          onChange={(emailOptions) => onUpdateForm(passenger.id, { emailOptions })}
          readOnly={readOnly}
        />
      </DetailRow>

      {showOrganizations ? (
        <DetailRow label="部门">
          {readOnly ? (
            <ReadOnlyDetailText
              value={
                hasOtherOrganizationInput(form)
                  ? form.otherOrganizationName
                  : form.organization.name
              }
            />
          ) : (
            <button
              type="button"
              className={detailActionClass}
              disabled={hasOtherOrganizationInput(form)}
              onClick={() => onOpenOrganization(passenger.id)}
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
          )}
        </DetailRow>
      ) : null}

      {showCostCenter ? (
        <DetailRow label="成本中心">
          {readOnly ? (
            <ReadOnlyDetailText
              value={
                hasOtherCostCenterInput(form)
                  ? [form.otherCostCenterCode, form.otherCostCenterName].filter(Boolean).join("-")
                  : formatCostCenterDisplay(form.costCenter)
              }
            />
          ) : (
            <button
              type="button"
              className={detailActionClass}
              disabled={hasOtherCostCenterInput(form)}
              onClick={() => onOpenCostCenter(passenger.id)}
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
          )}
        </DetailRow>
      ) : null}

      <DetailRow label="其他电话">
        {readOnly ? (
          <ReadOnlyDetailText value={form.otherMobile} />
        ) : (
          <input
            type="tel"
            value={form.otherMobile}
            placeholder="请输入"
            onChange={(event) => onUpdateForm(passenger.id, { otherMobile: event.target.value })}
            className={detailValueClass}
          />
        )}
      </DetailRow>

      <DetailRow label="其他邮箱">
        {readOnly ? (
          <ReadOnlyDetailText value={form.otherEmail} />
        ) : (
          <input
            type="email"
            value={form.otherEmail}
            placeholder="请输入"
            onChange={(event) => onUpdateForm(passenger.id, { otherEmail: event.target.value })}
            className={detailValueClass}
          />
        )}
      </DetailRow>

      {showOrganizations && !readOnly ? (
        <DetailRow label="其他部门">
          <input
            type="text"
            value={form.otherOrganizationName}
            placeholder="请输入名称"
            onChange={(event) => {
              const value = event.target.value;
              onUpdateForm(passenger.id, {
                otherOrganizationName: value,
                ...(value.trim() ? { organization: emptyOrgCost } : {}),
              });
            }}
            className={detailValueClass}
          />
        </DetailRow>
      ) : null}

      {showCostCenter && !readOnly ? (
        <>
          <DetailRow label="其他成本中心名称">
            <input
              type="text"
              value={form.otherCostCenterName}
              placeholder="请输入名称"
              onChange={(event) => {
                const value = event.target.value;
                onUpdateForm(passenger.id, {
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
                onUpdateForm(passenger.id, {
                  otherCostCenterCode: value,
                  ...(value.trim() ? { costCenter: emptyOrgCost } : {}),
                });
              }}
              className={detailValueClass}
            />
          </DetailRow>
        </>
      ) : null}
    </FlightBookExpandableSummaryCard>
  );
}

interface FlightBookPassengersProps {
  returnTo: string;
  passengers: PassengerBookInfo[];
  forms: FlightPassengerBookForm[];
  showOrganizations: boolean;
  showCostCenter: boolean;
  allowAddPassenger?: boolean;
  readOnly?: boolean;
  onRemove?: (passenger: PassengerBookInfo) => void;
  onUpdateForm: (passengerId: string, patch: Partial<FlightPassengerBookForm>) => void;
  onOpenOrganization: (passengerId: string) => void;
  onOpenCostCenter: (passengerId: string) => void;
  onChangeCredential?: (passenger: PassengerBookInfo) => void;
}

export function FlightBookPassengers({
  returnTo,
  passengers,
  forms,
  showOrganizations,
  showCostCenter,
  allowAddPassenger = false,
  readOnly = false,
  onRemove,
  onUpdateForm,
  onOpenOrganization,
  onOpenCostCenter,
  onChangeCredential,
}: FlightBookPassengersProps) {
  const selectPath = buildPassengerSelectPath(ProductType.Flight, returnTo);

  if (passengers.length === 0) {
    if (readOnly) {
      return (
        <div className="rounded-xl bg-[#F8F9FC] px-3.5 py-3 text-[13px] text-[#999999] ring-1 ring-[#EEF1F6]">
          暂无乘机人
        </div>
      );
    }
    return (
      <div className="flex items-center justify-between rounded-xl bg-[#F8F9FC] px-3.5 py-3 ring-1 ring-[#EEF1F6]">
        <p className="text-[13px] text-[#999999]">请选择乘机人</p>
        <Link to={selectPath} className="text-[14px] text-brand-primary" aria-label="选择乘机人">
          去选择
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {passengers.map((passenger) => {
        const form = forms.find((item) => item.passengerId === passenger.id);
        if (!form) return null;

        return (
          <FlightBookPassengerCard
            key={passenger.id}
            passenger={passenger}
            form={form}
            showOrganizations={showOrganizations}
            showCostCenter={showCostCenter}
            readOnly={readOnly}
            onRemove={onRemove}
            onUpdateForm={onUpdateForm}
            onOpenOrganization={onOpenOrganization}
            onOpenCostCenter={onOpenCostCenter}
            onChangeCredential={onChangeCredential}
          />
        );
      })}
      {allowAddPassenger ? (
        <Link
          to={selectPath}
          className="flex h-11 items-center justify-center gap-1.5 text-[14px] font-medium text-brand-primary active:opacity-80"
        >
          <span className="text-[18px] leading-none" aria-hidden>
            +
          </span>
          添加旅客
        </Link>
      ) : null}
    </div>
  );
}
