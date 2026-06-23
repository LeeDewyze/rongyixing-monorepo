import { Link } from "react-router-dom";
import { ProductType, credentialDisplayNumber, credentialDisplayType } from "@ryx/shared-types";

import { usePassengerSelection } from "@/hooks/usePassenger";
import { buildPassengerSelectPath } from "@/lib/passenger-selection";

interface FlightBookPassengersProps {
  returnTo: string;
}

export function FlightBookPassengers({ returnTo }: FlightBookPassengersProps) {
  const { selected } = usePassengerSelection(ProductType.Flight);
  const selectPath = buildPassengerSelectPath(ProductType.Flight, returnTo);

  return (
    <section className="rounded-xl bg-white px-3 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-semibold text-[#222222]">旅客信息</h2>
      </div>

      {selected.length === 0 ? (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-[#f6f8fc] px-3 py-3">
          <p className="text-[13px] text-[#999999]">请选择乘机人</p>
          <Link
            to={selectPath}
            className="flex size-5 items-center justify-center rounded-full border border-[#5099fe] text-[16px] font-light leading-none text-[#5099fe]"
            aria-label="选择乘机人"
          >
            +
          </Link>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {selected.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-[#f6f8fc] px-3 py-3"
            >
              <div className="min-w-0">
                <p className="text-[16px] font-semibold text-[#222222]">{item.credential.Name}</p>
                <p className="mt-1 truncate text-[13px] leading-snug text-[#666666]">
                  {credentialDisplayType(item.credential)}：
                  {credentialDisplayNumber(item.credential)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link to={selectPath} className="text-[13px] text-[#5099fe]">
                  全部信息
                </Link>
                <Link
                  to={selectPath}
                  className="flex size-5 items-center justify-center rounded-full border border-[#5099fe] text-[16px] font-light leading-none text-[#5099fe]"
                  aria-label="选择乘机人"
                >
                  +
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
