import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getApi } from "@/lib/api";

export function useSearchLinkman(keyword: string, enabled: boolean) {
  const [debounced, setDebounced] = useState(keyword);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(keyword.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  return useQuery({
    queryKey: ["book", "searchLinkman", debounced],
    queryFn: () => getApi().book.searchLinkman(debounced),
    enabled,
    staleTime: 30_000,
  });
}
