import type {
  FlightBookPolicy,
  FlightInitBookResponse,
  FlightInitStaff,
  FlightOutNumberField,
  FlightPassengerBookForm,
  PassengerBookInfo,
} from "@ryx/shared-types";

import { FlightBookCollapseIcon } from "@/components/flight/FlightBookCollapseIcon";
import {
  groupStaffApprovers,
  shouldShowApproveNode,
  shouldShowApproverPicker,
  shouldShowTravelSection,
} from "@/lib/flight-book-approval";
import { buildPassengerOutNumberFields } from "@/lib/flight-book-outnumber";
import { policyHasViolation } from "@/lib/flight-book-policy";
import { filterFlightExpenseTypes, shouldRequireIllegalReason } from "@/lib/flight-book-travel";
import type { HomeTravelMode } from "@/config/home-assets";

interface FlightBookTravelSectionProps {
  passenger: PassengerBookInfo;
  form: FlightPassengerBookForm;
  passengerCount?: number;
  staff?: FlightInitStaff;
  init?: FlightInitBookResponse;
  policy?: FlightBookPolicy;
  onUpdate: (patch: Partial<FlightPassengerBookForm>) => void;
  onOpenApprover: () => void;
  onOpenIllegalReason: () => void;
  onOpenExpenseType: () => void;
  onOpenOutNumber: (field: FlightOutNumberField) => void;
  travelMode?: HomeTravelMode;
}

export function FlightBookTravelSection({
  passenger,
  form,
  passengerCount = 1,
  staff,
  init,
  policy,
  onUpdate,
  onOpenApprover,
  onOpenIllegalReason,
  onOpenExpenseType,
  onOpenOutNumber,
  travelMode,
}: FlightBookTravelSectionProps) {
  const outNumberFields = buildPassengerOutNumberFields({
    passenger,
    staff,
    init,
    travelNumber: init?.TravelFrom?.TravelNumber,
    travelMode,
  });
  const expenseTypes = filterFlightExpenseTypes(init?.ExpenseTypes);
  const showSection = shouldShowTravelSection({
    policy,
    expenseTypes,
    staff,
    init,
    outNumberFieldCount: outNumberFields.length,
    passenger,
  });
  const showApproverPicker = shouldShowApproverPicker({ init, policy, staff, passenger });
  const showApproveNode = shouldShowApproveNode(init, policy);
  const approverLevels = groupStaffApprovers(staff);
  const requireIllegalReason = shouldRequireIllegalReason({ policy, init });

  if (!showSection) return null;

  return (
    <div className="rounded-xl bg-white px-3 py-3">
      <button
        type="button"
        className="flex w-full items-center justify-between"
        onClick={() => onUpdate({ showTravelDetail: !form.showTravelDetail })}
      >
        <div className="min-w-0 text-left">
          <p className="text-[14px] font-medium text-[#333333]">出差信息</p>
          {passengerCount > 1 ? (
            <p className="mt-0.5 truncate text-[12px] text-[#999999]">适用于全部乘机人</p>
          ) : null}
        </div>
        <FlightBookCollapseIcon expanded={form.showTravelDetail} />
      </button>

      {form.showTravelDetail ? (
        <div className="space-y-0 border-t border-[#f0f0f0] pt-1">
          {policyHasViolation(policy) && !passenger.isNotWhitelist ? (
            init?.IllegalReasons?.length ? (
              <button
                type="button"
                className="flex w-full items-center gap-3 border-b border-[#f0f0f0] py-3 text-left"
                onClick={onOpenIllegalReason}
              >
                <span className="w-[5.5rem] shrink-0 whitespace-nowrap text-[14px] text-[#808080]">
                  超标原因{requireIllegalReason ? " *" : ""}
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px] text-[#333333]">
                  {form.otherIllegalReason || form.illegalReason || "请选择或填写"}
                </span>
                <span className="text-[#cccccc]">›</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 border-b border-[#f0f0f0] py-3">
                <span className="w-[5.5rem] shrink-0 whitespace-nowrap text-[14px] text-[#808080]">
                  超标原因{requireIllegalReason ? " *" : ""}
                </span>
                <input
                  type="text"
                  value={form.otherIllegalReason}
                  placeholder="请输入超标原因"
                  className="min-w-0 flex-1 bg-transparent text-[14px] text-[#333333] outline-none"
                  onChange={(event) => onUpdate({ otherIllegalReason: event.target.value })}
                />
              </div>
            )
          ) : null}

          {outNumberFields.map((field) =>
            field.canSelect ? (
              <button
                key={field.key}
                type="button"
                className="flex w-full items-center gap-3 border-b border-[#f0f0f0] py-3 text-left"
                onClick={() => onOpenOutNumber(field)}
              >
                <span className="w-[5.5rem] shrink-0 whitespace-nowrap text-[14px] text-[#808080]">
                  {field.label}
                  {field.required ? " *" : ""}
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px] text-[#333333]">
                  {form.outNumbers[field.key] ?? field.value ?? "请选择"}
                </span>
                <span className="text-[#cccccc]">›</span>
              </button>
            ) : (
              <div
                key={field.key}
                className="flex items-center gap-3 border-b border-[#f0f0f0] py-3"
              >
                <span className="w-[5.5rem] shrink-0 whitespace-nowrap text-[14px] text-[#808080]">
                  {field.label}
                  {field.required ? " *" : ""}
                </span>
                <input
                  type="text"
                  value={form.outNumbers[field.key] ?? field.value ?? ""}
                  placeholder={`请输入${field.label}`}
                  className="min-w-0 flex-1 bg-transparent text-[14px] text-[#333333] outline-none"
                  onChange={(event) =>
                    onUpdate({
                      outNumbers: {
                        ...form.outNumbers,
                        [field.key]: event.target.value,
                      },
                    })
                  }
                />
              </div>
            ),
          )}

          {expenseTypes.length ? (
            <button
              type="button"
              className="flex w-full items-center gap-3 border-b border-[#f0f0f0] py-3 text-left"
              onClick={onOpenExpenseType}
            >
              <span className="w-[5.5rem] shrink-0 whitespace-nowrap text-[14px] text-[#808080]">
                费用类别
              </span>
              <span className="min-w-0 flex-1 truncate text-[14px] text-[#333333]">
                {form.expenseType || "请选择"}
              </span>
              <span className="text-[#cccccc]">›</span>
            </button>
          ) : null}

          {showApproveNode && approverLevels.length ? (
            <div className="border-b border-[#f0f0f0] py-3">
              <p className="mb-2 text-[14px] text-[#808080]">审批人</p>
              <div className="space-y-1.5">
                {approverLevels.map((level) => (
                  <p key={level.tag} className="text-[13px] text-[#333333]">
                    第{level.tag}级：
                    {level.approvers.map((item) => item.Name).join("、")}
                    {level.type === 1 ? "（所有通过）" : "（任意通过）"}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          {showApproverPicker ? (
            <button
              type="button"
              className="flex w-full items-center gap-3 py-3 text-left"
              onClick={onOpenApprover}
            >
              <span className="w-[5.5rem] shrink-0 whitespace-nowrap text-[14px] text-[#808080]">
                选择审批人
              </span>
              <span className="min-w-0 flex-1 truncate text-[14px] text-[#333333]">
                {form.selectedApproverName || "请选择"}
              </span>
              <span className="text-[#cccccc]">›</span>
            </button>
          ) : null}

          {init?.isSkipApprove ? (
            <label className="flex items-center gap-2 py-3 text-[13px] text-[#666666]">
              <input
                type="checkbox"
                checked={form.isSkipApprove}
                onChange={(event) => onUpdate({ isSkipApprove: event.target.checked })}
                className="size-4 accent-[#5099fe]"
              />
              跳过审批
            </label>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function buildPassengerOutNumberFieldsMap(input: {
  passengers: PassengerBookInfo[];
  staffs?: FlightInitStaff[];
  init?: FlightInitBookResponse;
  travelMode?: HomeTravelMode;
}): Record<string, FlightOutNumberField[]> {
  const { passengers, staffs, init, travelMode } = input;
  const map: Record<string, FlightOutNumberField[]> = {};
  for (const passenger of passengers) {
    const passengerAccountId =
      "AccountId" in passenger.passenger ? passenger.passenger.AccountId : undefined;
    const staff = staffs?.find(
      (item) =>
        String(item.Account?.Id ?? "") ===
        String(passengerAccountId ?? passenger.credential.AccountId ?? passenger.id),
    );
    map[passenger.id] = buildPassengerOutNumberFields({
      passenger,
      staff,
      init,
      travelNumber: init?.TravelFrom?.TravelNumber,
      travelMode,
    });
  }
  return map;
}
