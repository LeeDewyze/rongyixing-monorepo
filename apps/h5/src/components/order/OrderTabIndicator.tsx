interface OrderTabIndicatorProps {
  active: boolean;
  width?: number;
}

/** Arc underline for order category tabs (wider than home travel-mode indicator). */
export function OrderTabIndicator({ active, width = 42 }: OrderTabIndicatorProps) {
  const height = 7;
  const mid = width / 2;
  const start = width * 0.125;
  const end = width * 0.875;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
      aria-hidden
    >
      <path
        d={`M${start} 2 Q${mid} 7 ${end} 2`}
        stroke={active ? "#2768FA" : "transparent"}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
