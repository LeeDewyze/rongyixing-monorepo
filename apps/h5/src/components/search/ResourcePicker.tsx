import { useMemo, useState } from "react";
import { Button } from "@ryx/ui/components/ui/button";

export interface PickerOption {
  id: string;
  label: string;
  sublabel?: string;
  searchText: string;
  hot?: boolean;
}

interface ResourcePickerProps {
  open: boolean;
  options: PickerOption[];
  title: string;
  placeholder?: string;
  onClose: () => void;
  onSelect: (option: PickerOption) => void;
}

/** Generic full-screen resource picker (city / station). */
export function ResourcePicker({
  open,
  options,
  title,
  placeholder = "搜索",
  onClose,
  onSelect,
}: ResourcePickerProps) {
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) {
      const hot = options.filter((o) => o.hot);
      return hot.length > 0 ? hot : options.slice(0, 30);
    }
    return options.filter((o) => o.searchText.toLowerCase().includes(q));
  }, [options, keyword]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          返回
        </Button>
        <h2 className="flex-1 text-center text-base font-semibold">{title}</h2>
        <span className="w-12" />
      </header>
      <div className="border-b px-4 py-2">
        <input
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          placeholder={placeholder}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          autoFocus
        />
      </div>
      <ul className="flex-1 overflow-y-auto">
        {filtered.map((opt) => (
          <li key={opt.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between border-b px-4 py-3 text-left active:bg-muted"
              onClick={() => {
                onSelect(opt);
                setKeyword("");
                onClose();
              }}
            >
              <span className="font-medium">{opt.label}</span>
              {opt.sublabel ? (
                <span className="text-xs text-muted-foreground">{opt.sublabel}</span>
              ) : null}
            </button>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="p-4 text-center text-sm text-muted-foreground">无匹配结果</li>
        ) : null}
      </ul>
    </div>
  );
}
