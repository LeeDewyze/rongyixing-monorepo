import { useQuery } from "@tanstack/react-query";

import { getApi } from "@/lib/api";

export function useBookOrgCostVisibility() {
  const organizations = useQuery({
    queryKey: ["book", "organizations"],
    queryFn: () => getApi().book.getOrganizations(),
    staleTime: 5 * 60_000,
  });
  const costCenters = useQuery({
    queryKey: ["book", "costCenters", ""],
    queryFn: () => getApi().book.getCostCenter(""),
    staleTime: 5 * 60_000,
  });

  return {
    showOrganizations: (organizations.data?.length ?? 0) > 0,
    showCostCenter: (costCenters.data?.length ?? 0) > 0,
    organizations: organizations.data ?? [],
    isLoading: organizations.isLoading || costCenters.isLoading,
  };
}
