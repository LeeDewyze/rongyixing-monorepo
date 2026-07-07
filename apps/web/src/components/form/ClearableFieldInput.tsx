import type { InputHTMLAttributes } from "react";

const defaultInputClass =
  "min-w-0 flex-1 bg-transparent text-right text-sm text-[#333333] outline-none placeholder:text-[#bbbbbb]";

interface ClearFieldButtonProps {
  onClear: () => void;
}

/** Circle clear control for form row inputs. */
export function ClearFieldButton({ onClear }: ClearFieldButtonProps) {
  return (
    <button
      type="button"
      className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#cccccc] text-white active:opacity-80"
      aria-label="清空"
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.stopPropagation();
        onClear();
      }}
    >
      <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 3l6 6M9 3L3 9" strokeLinecap="round" />
      </svg>
    </button>
  );
}

interface ClearableFieldInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  value: string;
  onClear: () => void;
  inputClassName?: string;
}

/** Text/date input with trailing clear button when value is non-empty. */
export function ClearableFieldInput({
  value,
  onClear,
  inputClassName = defaultInputClass,
  ...props
}: ClearableFieldInputProps) {
  const showClear = value.length > 0;

  return (
    <>
      <input className={inputClassName} value={value} {...props} />
      {showClear ? <ClearFieldButton onClear={onClear} /> : null}
    </>
  );
}

export { defaultInputClass as clearableFieldInputClass };
