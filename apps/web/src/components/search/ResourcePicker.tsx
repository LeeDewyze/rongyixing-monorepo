import { useEffect, useMemo, useState } from "react";
import { cn } from "@ryx/ui/lib/utils";

export interface PickerOption {
  id: string;
  label: string;
  sublabel?: string;
  searchText: string;
  hot?: boolean;
}

export type ResourcePickerVariant = "default" | "staff";

interface ResourcePickerProps {
  open: boolean;
  options: PickerOption[];
  title: string;
  placeholder?: string;
  /** When true, show the full option list instead of hot items / first 30. */
  showAllOptions?: boolean;
  onSearch?: (keyword: string) => Promise<PickerOption[]>;
  variant?: ResourcePickerVariant;
  selectedOptionId?: string;
  className?: string;
  onClose: () => void;
  onSelect: (option: PickerOption) => void;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
      <path
        d="M12.5 4.5 7 10l5.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
      <circle cx="8.75" cy="8.75" r="4.75" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="m12.5 12.5 3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
      <circle cx="10" cy="10" r="8" fill="currentColor" />
      <path
        d="m6.5 10 2.25 2.25L13.75 7"
        fill="none"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
      <circle cx="13" cy="13" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="m18.5 18.5 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M10 13h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function avatarLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "?";
  const name = trimmed.includes("-") ? trimmed.split("-").at(-1)?.trim() || trimmed : trimmed;
  return name.slice(-1).toUpperCase();
}

/** Generic full-screen resource picker with an enhanced staff selection variant. */
export function ResourcePicker({
  open,
  options,
  title,
  placeholder = "搜索",
  showAllOptions = false,
  onSearch,
  variant = "default",
  selectedOptionId,
  className,
  onClose,
  onSelect,
}: ResourcePickerProps) {
  const [keyword, setKeyword] = useState("");
  const [remoteOptions, setRemoteOptions] = useState<PickerOption[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const isStaffPicker = variant === "staff";

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
  const trimmedKeyword = keyword.trim();
  const listTitle = trimmedKeyword ? "搜索结果" : isStaffPicker ? "可选择的出差人" : "全部结果";
  const emptyTitle = isStaffPicker ? "未找到匹配的出差人" : "无匹配结果";

  function handleClose() {
    setKeyword("");
    setRemoteOptions(null);
    setSearchError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <div className={cn("fixed inset-0 z-[60] flex flex-col bg-muted", className)}>
      <header className="shrink-0 border-b border-border bg-card pt-[env(safe-area-inset-top)]">
        <div className="relative mx-auto flex h-12 max-w-2xl items-center px-2 sm:px-4">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleClose}
            aria-label="返回"
          >
            <BackIcon />
          </button>
          <div className="pointer-events-none absolute inset-x-14 text-center">
            <h2 className="truncate text-base font-semibold text-brand-title">{title}</h2>
            {isStaffPicker ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">按姓名或工号查找员工</p>
            ) : null}
          </div>
        </div>
      </header>

      <div className="shrink-0 border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-xl border border-transparent bg-secondary px-3 transition-colors focus-within:border-brand-primary/30 focus-within:bg-card focus-within:ring-2 focus-within:ring-brand-primary/10">
          <span className="shrink-0 text-muted-foreground">
            <SearchIcon />
          </span>
          <input
            type="search"
            className="h-10 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            placeholder={placeholder}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            autoFocus
          />
          {keyword ? (
            <button
              type="button"
              className="rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setKeyword("")}
            >
              清除
            </button>
          ) : null}
        </div>
      </div>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-3 sm:py-4">
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="text-sm font-medium text-foreground">{listTitle}</h3>
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {isSearching ? "正在查询" : `${filtered.length} 人`}
            </span>
          </div>

          {isSearching ? (
            <div
              className="overflow-hidden rounded-xl border border-border bg-card"
              aria-label="搜索中"
            >
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <div className="size-10 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-2/5 animate-pulse rounded bg-muted motion-reduce:animate-none" />
                    <div className="h-3 w-3/5 animate-pulse rounded bg-muted motion-reduce:animate-none" />
                  </div>
                </div>
              ))}
            </div>
          ) : searchError ? (
            <div className="rounded-xl border border-destructive/20 bg-card px-4 py-4 text-sm text-destructive">
              {searchError}
            </div>
          ) : filtered.length ? (
            <ul className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              {filtered.map((opt) => {
                const selected = opt.id === selectedOptionId;
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      className={cn(
                        "flex min-h-16 w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent active:opacity-80 focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                        selected && "bg-brand-primary/5 hover:bg-brand-primary/10",
                      )}
                      onClick={() => {
                        onSelect(opt);
                        setKeyword("");
                        setRemoteOptions(null);
                        setSearchError(null);
                        onClose();
                      }}
                    >
                      {isStaffPicker ? (
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-sm font-semibold text-brand-primary">
                          {avatarLabel(opt.label)}
                        </span>
                      ) : null}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {opt.label}
                        </span>
                        {opt.sublabel ? (
                          <span className="mt-1 block truncate text-xs text-muted-foreground">
                            {opt.sublabel}
                          </span>
                        ) : null}
                      </span>
                      {selected ? (
                        <span className="shrink-0 text-brand-primary" aria-label="已选择">
                          <CheckIcon />
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 text-center">
              <span className="text-muted-foreground">
                <EmptyIcon />
              </span>
              <p className="mt-3 text-sm font-medium text-foreground">{emptyTitle}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {trimmedKeyword ? "请检查姓名或工号后重新搜索" : "暂时没有可选择的数据"}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
