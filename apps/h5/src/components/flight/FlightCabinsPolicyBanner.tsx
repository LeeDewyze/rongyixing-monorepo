interface FlightCabinsPolicyBannerProps {
  passengerName: string;
  onClick?: () => void;
}

export function FlightCabinsPolicyBanner({
  passengerName,
  onClick,
}: FlightCabinsPolicyBannerProps) {
  const content = (
    <p className="text-[12px] leading-snug text-[#5099fe]">
      已按照【{passengerName}】的差旅标准过滤舱位
    </p>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className="mx-3 mt-2 w-[calc(100%-1.5rem)] rounded-lg bg-[#eef3ff] px-3 py-2 text-left active:opacity-90"
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return <div className="mx-3 mt-2 rounded-lg bg-[#eef3ff] px-3 py-2">{content}</div>;
}
