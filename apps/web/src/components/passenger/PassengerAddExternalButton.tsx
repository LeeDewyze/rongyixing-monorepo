/** Navigates to /passenger/credential for adding external passengers. */
interface PassengerAddExternalButtonProps {
  onClick: () => void;
}

export function PassengerAddExternalButton({ onClick }: PassengerAddExternalButtonProps) {
  return (
    <button
      type="button"
      className="mx-4 mb-3 flex h-11 w-[calc(100%-2rem)] items-center justify-center gap-1 rounded-full border border-[#5099fe] bg-white text-sm font-medium text-[#5099fe] active:bg-[#e8eeff]"
      onClick={onClick}
    >
      <span className="text-lg leading-none" aria-hidden>
        +
      </span>
      新增出行人
    </button>
  );
}
