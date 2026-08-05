import { useEffect, useMemo, useState } from "react";
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
  /** When true, show the full option list instead of hot items / first 30. */
  showAllOptions?: boolean;
  onSearch?: (keyword: string) => Promise<PickerOption[]>;
  onClose: () => void;
  onSelect: (option: PickerOption) => void;
}

/** Generic full-screen resource picker (city / station). */
export function ResourcePicker({
  open,
  options,
  title,
  placeholder = "搜索",
  showAllOptions = false,
  onSearch,
  onClose,
  onSelect,
}: ResourcePickerProps) {
  const [keyword, setKeyword] = useState("");
  const [remoteOptions, setRemoteOptions] = useState<PickerOption[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setKeyword("");
      setRemoteOptions(null);
      setIsSearching(false);
      setSearchError(null);
      return;
    }
    const q = keyword.trim();
    if (!onSearch || !q) {
      setRemoteOptions(null);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    let active = true;
    setRemoteOptions(null);
    setIsSearching(true);
    setSearchError(null);
    const timer = window.setTimeout(() => {
      onSearch(q)
        .then((next) => {
          if (active) setRemoteOptions(next);
        })
        .catch(() => {
          if (active) {
            setRemoteOptions([]);
            setSearchError("搜索失败，请重试");
          }
        })
        .finally(() => {
          if (active) setIsSearching(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [keyword, onSearch, open]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (q && onSearch) return remoteOptions ?? [];
    if (!q) {
      if (showAllOptions) return options;
      const hot = options.filter((o) => o.hot);
      return hot.length > 0 ? hot : options.slice(0, 30);
    }
    return options.filter((o) => o.searchText.toLowerCase().includes(q));
  }, [options, keyword, showAllOptions, onSearch, remoteOptions]);

  function handleClose() {
    setKeyword("");
    setRemoteOptions(null);
    setSearchError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <Button variant="ghost" size="sm" onClick={handleClose}>
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
                setRemoteOptions(null);
                setSearchError(null);
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
        {isSearching ? (
          <li className="p-4 text-center text-sm text-muted-foreground">搜索中...</li>
        ) : null}
        {!isSearching && searchError ? (
          <li className="p-4 text-center text-sm text-destructive">{searchError}</li>
        ) : null}
        {!isSearching && !searchError && filtered.length === 0 ? (
          <li className="p-4 text-center text-sm text-muted-foreground">无匹配结果</li>
        ) : null}
      </ul>
    </div>
  );
}
