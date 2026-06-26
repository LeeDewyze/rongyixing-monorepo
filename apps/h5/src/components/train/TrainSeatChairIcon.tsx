export type TrainSeatChairIconVariant = "default" | "selected" | "issued";
export type TrainSeatChairIconSize = "sm" | "md";

const VARIANT_STYLES: Record<
  TrainSeatChairIconVariant,
  { fill: string; shell: string; panel: string; text: string }
> = {
  default: {
    fill: "bg-[#F8F8F8]",
    shell: "border-[#D9D9D9]",
    panel: "border-[#E5E5E5]",
    text: "text-[#8C8C8C]",
  },
  selected: {
    fill: "bg-[#2768FA]",
    shell: "border-[#2768FA]",
    panel: "border-[#79A7FF]",
    text: "text-[#FFFFFF]",
  },
  issued: {
    fill: "bg-[#FFFFFF]",
    shell: "border-[#95DE64]",
    panel: "border-[#B7EB8F]",
    text: "text-[#52C41A]",
  },
};

export interface TrainSeatChairIconProps {
  code: string;
  selected?: boolean;
  variant?: TrainSeatChairIconVariant;
  size?: TrainSeatChairIconSize;
}

export function TrainSeatChairIcon({
  code,
  selected = false,
  variant,
  size = "md",
}: TrainSeatChairIconProps) {
  const resolvedVariant = variant ?? (selected ? "selected" : "default");
  const styles = VARIANT_STYLES[resolvedVariant];
  const scaleClass = size === "sm" ? "scale-[0.65] origin-center" : "";

  return (
    <span
      className={`relative inline-block h-[30px] w-[35px] shrink-0 ${scaleClass}`}
      aria-hidden
    >
      <span
        className={`absolute left-0 top-[6px] h-[20px] w-[9px] rounded-[3px] border ${styles.fill} ${styles.shell}`}
      />
      <span
        className={`absolute right-0 top-[6px] h-[20px] w-[9px] rounded-[3px] border ${styles.fill} ${styles.shell}`}
      />
      <span
        className={`absolute bottom-0 left-[6px] h-[13px] w-[23px] rounded-[3px] border ${styles.fill} ${styles.shell}`}
      />
      <span
        className={`absolute left-[7px] top-[2px] flex h-[24px] w-[21px] items-center justify-center rounded-[4px] border ${styles.fill} ${styles.panel} ${styles.text}`}
      >
        <span className="text-[15px] font-normal leading-none">{code}</span>
      </span>
    </span>
  );
}
