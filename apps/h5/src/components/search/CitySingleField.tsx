interface CitySingleFieldProps {
  label: string;
  placeholder?: string;
  onSelect: () => void;
}

export function CitySingleField({
  label,
  placeholder = "请选择目的地",
  onSelect,
}: CitySingleFieldProps) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between border-b py-4 text-left"
      onClick={onSelect}
    >
      <span className="text-xs text-muted-foreground">目的地</span>
      <span className="text-xl font-semibold text-primary">{label || placeholder}</span>
    </button>
  );
}
