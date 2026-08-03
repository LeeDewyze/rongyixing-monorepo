import { useQuery } from "@tanstack/react-query";
import {
  ProductType,
  credentialDisplayNumber,
  credentialDisplayType,
  credentialKey,
  type PassengerBookInfo,
  type PassengerCredential,
  type ProductChannel,
} from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import { formatApiError } from "@/lib/formatApiError";
import { isCredentialAllowed } from "@/lib/passenger-select-logic";

interface FlightBookCredentialSheetProps {
  open: boolean;
  passenger: PassengerBookInfo | null;
  productType?: ProductType;
  channel?: ProductChannel;
  onClose: () => void;
  onSelect: (credential: PassengerCredential) => void;
}

function resolveStaffAccountId(passenger: PassengerBookInfo): string | undefined {
  const fromPassenger =
    "AccountId" in passenger.passenger ? passenger.passenger.AccountId : undefined;
  if (fromPassenger) return String(fromPassenger);
  const passengerId = "Id" in passenger.passenger ? passenger.passenger.Id : undefined;
  if (passengerId) return String(passengerId);
  return passenger.credential.AccountId ? String(passenger.credential.AccountId) : undefined;
}

export function FlightBookCredentialSheet({
  open,
  passenger,
  productType = ProductType.Flight,
  channel,
  onClose,
  onSelect,
}: FlightBookCredentialSheetProps) {
  const accountId = passenger ? resolveStaffAccountId(passenger) : undefined;
  const isTourist = channel === "tourist";

  const credentials = useQuery({
    queryKey: ["passenger", isTourist ? "touristCredentials" : "staffCredentials", accountId],
    queryFn: () =>
      isTourist
        ? getApi().passenger.getCredentials({ accountId: accountId!, channel })
        : getApi().passenger.getStaffCredentials({ AccountId: accountId! }),
    enabled: open && Boolean(accountId),
    staleTime: 60_000,
  });

  if (!open || !passenger) return null;

  const items = credentials.data?.filter((item) => isCredentialAllowed(item, productType)) ?? [];
  const selectedKey = credentialKey(passenger.credential);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div className="max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="sticky top-0 border-b border-[#eeeeee] bg-white px-4 py-3">
          <p className="text-center text-[16px] font-semibold text-[#333333]">选择证件</p>
        </div>

        <div className="px-4 py-2">
          {!accountId ? (
            <p className="py-8 text-center text-[13px] text-[#999999]">
              当前出行人暂不支持切换证件
            </p>
          ) : credentials.isFetching ? (
            <p className="py-8 text-center text-[13px] text-[#999999]">正在加载…</p>
          ) : credentials.error ? (
            <p className="py-8 text-center text-[13px] text-destructive">
              {formatApiError(credentials.error)}
            </p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[#999999]">暂无可用证件</p>
          ) : (
            <ul className="divide-y divide-[#f0f0f0]">
              {items.map((item) => {
                const selected = credentialKey(item) === selectedKey;
                const label = `${credentialDisplayType(item)} ${credentialDisplayNumber(item)}`;
                return (
                  <li key={item.Id ?? credentialKey(item)}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between py-3.5 text-left text-[15px] active:bg-[#f5f7fa]"
                      onClick={() => {
                        onSelect(item);
                        onClose();
                      }}
                    >
                      <span className={selected ? "font-medium text-[#5099fe]" : "text-[#333333]"}>
                        {label}
                      </span>
                      {selected ? <span className="text-[#5099fe]">✓</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
