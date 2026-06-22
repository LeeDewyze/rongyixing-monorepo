interface FlightCabinsHeaderProps {
  title: string;
  onBack: () => void;
}

export function FlightCabinsHeader({ title, onBack }: FlightCabinsHeaderProps) {
  return (
    <div className="flex items-center px-1 pb-2 pt-1">
      <button
        type="button"
        className="flex h-11 w-10 shrink-0 items-center justify-center text-[22px] font-light leading-none text-[#333333] active:opacity-70"
        aria-label="返回"
        onClick={onBack}
      >
        ‹
      </button>

      <p className="min-w-0 flex-1 truncate text-center text-[17px] font-medium text-[#333333]">
        {title}
      </p>

      <div className="h-11 w-10 shrink-0" aria-hidden />
    </div>
  );
}
