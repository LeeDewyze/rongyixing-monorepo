export interface HotelRoomSpecItem {
  label: string;
  value: string;
}

interface HotelRoomDetailSpecGridProps {
  items: HotelRoomSpecItem[];
}

function SpecCell({ label, value }: HotelRoomSpecItem) {
  return (
    <div className="bg-white px-3.5 py-3">
      <p className="text-[11px] font-medium text-[#999999]">{label}</p>
      <p className="mt-1 text-[14px] font-medium leading-snug text-[#333333]">
        {value.trim() ? value : "—"}
      </p>
    </div>
  );
}

export function HotelRoomDetailSpecGrid({ items }: HotelRoomDetailSpecGridProps) {
  if (!items.length) return null;

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-1 ring-[#E8ECF3]">
      <div className="flex items-center gap-2 border-b border-[#F0F2F5] px-4 py-3">
        <span className="h-3.5 w-0.5 shrink-0 rounded-full bg-brand-primary" aria-hidden />
        <h3 className="text-[14px] font-semibold text-[#333333]">房型信息</h3>
      </div>
      <div className="grid grid-cols-2 gap-px bg-[#F0F2F5]">
        {items.map((item) => (
          <SpecCell key={item.label} label={item.label} value={item.value} />
        ))}
        {items.length % 2 === 1 ? <div className="bg-white" aria-hidden /> : null}
      </div>
    </div>
  );
}
