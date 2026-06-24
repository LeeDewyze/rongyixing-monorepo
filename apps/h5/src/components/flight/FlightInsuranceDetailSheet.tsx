interface FlightInsuranceDetailSheetProps {
  open: boolean;
  title: string;
  url: string;
  onClose: () => void;
}

/** Legacy `onShowProductDetail` — iframe for insurance `DetailUrl`. */
export function FlightInsuranceDetailSheet({
  open,
  title,
  url,
  onClose,
}: FlightInsuranceDetailSheetProps) {
  if (!open || !url) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div className="flex max-h-[85vh] flex-col rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between border-b border-[#eeeeee] px-4 py-3">
          <button
            type="button"
            className="min-w-[2rem] text-[22px] leading-none text-[#999999]"
            aria-label="关闭"
            onClick={onClose}
          >
            ×
          </button>
          <p className="flex-1 truncate px-2 text-center text-[16px] font-semibold text-[#333333]">
            {title}
          </p>
          <span className="min-w-[2rem]" />
        </div>
        <iframe title={title} src={url} className="min-h-[60vh] w-full flex-1 border-0" />
      </div>
    </div>
  );
}
