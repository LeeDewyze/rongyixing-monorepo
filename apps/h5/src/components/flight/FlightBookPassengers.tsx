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
}: {
  options: FlightPassengerBookForm["mobileOptions"];
  onChange: (next: FlightPassengerBookForm["mobileOptions"]) => void;
}) {
  if (!options.length) {
    return <p className="text-right text-[14px] text-[#999999]">暂无</p>;
  }

  return (
    <div className="space-y-2">
      {options.map((option, index) => (
        <label
          key={`${option.value}-${index}`}
          className="flex items-center justify-end gap-2 text-[14px] leading-tight text-[#333333]"
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
            className="size-4 shrink-0 accent-[#5099fe]"
          />
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
  const fromPassenger = passenger.passenger.AccountId;
  if (fromPassenger) return String(fromPassenger);
  return passenger.credential.AccountId ? String(passenger.credential.AccountId) : undefined;
}

interface FlightBookPassengersProps {
  returnTo: string;
  passengers: PassengerBookInfo[];
  forms: FlightPassengerBookForm[];
  showOrganizations: boolean;
  showCostCenter: boolean;
  onUpdateForm: (passengerId: string, patch: Partial<FlightPassengerBookForm>) => void;
  onOpenOrganization: (passengerId: string) => void;
  onOpenCostCenter: (passengerId: string) => void;
  onChangeCredential: (passenger: PassengerBookInfo) => void;
}

export function FlightBookPassengers({
  returnTo,
  passengers,
  forms,
  showOrganizations,
  showCostCenter,
  onUpdateForm,
  onOpenOrganization,
  onOpenCostCenter,
  onChangeCredential,
}: FlightBookPassengersProps) {
  const selectPath = buildPassengerSelectPath(ProductType.Flight, returnTo);

  if (passengers.length === 0) {
    return (
      <div className="flex items-center justify-between rounded-xl bg-[#F8F9FC] px-3.5 py-3 ring-1 ring-[#EEF1F6]">
        <p className="text-[13px] text-[#999999]">请选择乘机人</p>
        <Link to={selectPath} className="text-[14px] text-[#2768FA]" aria-label="选择乘机人">
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

          const canSwitchCredential = Boolean(resolveStaffAccountId(passenger));
          const credentialLine = `${credentialDisplayType(passenger.credential)}：${credentialDisplayNumber(passenger.credential)}`;

          return (
            <FlightBookExpandableSummaryCard
              key={passenger.id}
              surface="plain"
              className="overflow-hidden rounded-xl ring-1 ring-[#EEF1F6]"
              name={passenger.credential.Name ?? ""}
              subtitle={credentialLine}
              expanded={form.expanded}
              onToggleExpanded={() => onUpdateForm(passenger.id, { expanded: !form.expanded })}
              footerAction={
                canSwitchCredential ? (
                  <FlightBookCredentialSwitchButton
                    onClick={() => onChangeCredential(passenger)}
                  />
                ) : null
              }
            >
              <DetailRow label="联系电话">
                <ContactCheckboxList
                  options={form.mobileOptions}
                  onChange={(mobileOptions) => onUpdateForm(passenger.id, { mobileOptions })}
                />
              </DetailRow>

              <DetailRow label="联系邮箱">
                <ContactCheckboxList
                  options={form.emailOptions}
                  onChange={(emailOptions) => onUpdateForm(passenger.id, { emailOptions })}
                />
              </DetailRow>

              {showOrganizations ? (
                <DetailRow label="部门">
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
                </DetailRow>
              ) : null}

              {showCostCenter ? (
                <DetailRow label="成本中心">
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
                </DetailRow>
              ) : null}

              <DetailRow label="其他电话">
                <input
                  type="tel"
                  value={form.otherMobile}
                  placeholder="请输入"
                  onChange={(event) => onUpdateForm(passenger.id, { otherMobile: event.target.value })}
                  className={detailValueClass}
                />
              </DetailRow>

              <DetailRow label="其他邮箱">
                <input
                  type="email"
                  value={form.otherEmail}
                  placeholder="请输入"
                  onChange={(event) => onUpdateForm(passenger.id, { otherEmail: event.target.value })}
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
                      onUpdateForm(passenger.id, {
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
        })}
    </div>
  );
}
