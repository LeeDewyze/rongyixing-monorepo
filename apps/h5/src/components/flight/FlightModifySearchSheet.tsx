import { useEffect } from "react";
import { Button } from "@ryx/ui/components/ui/button";

import {
  FlightCityPickerHostFromForm,
  FlightSearchFields,
} from "@/components/flight/common";
import { useFlightSearchForm } from "@/hooks/useFlightSearchForm";
import type { FlightSearchQueryInitial } from "@/lib/flight-search";
import { formatApiError } from "@/lib/formatApiError";

export type FlightModifySearchInitial = FlightSearchQueryInitial;

interface FlightModifySearchSheetProps {
  open: boolean;
  initial: FlightModifySearchInitial;
  onClose: () => void;
  onSearch: (params: URLSearchParams) => void;
}

/** Full-screen overlay to modify city/date on list page. */
export function FlightModifySearchSheet({
  open,
  initial,
  onClose,
  onSearch,
}: FlightModifySearchSheetProps) {
  const form = useFlightSearchForm();
  const { airports, resetFromQuery } = form;

  useEffect(() => {
    if (!open || !airports.length) return;
    resetFromQuery(initial);
  }, [
    open,
    initial.fromCode,
    initial.toCode,
    initial.fromName,
    initial.toName,
    initial.date,
    initial.fromAsAirport,
    initial.toAsAirport,
    airports.length,
    resetFromQuery,
  ]);

  if (!open) return null;

  function handleSubmit() {
    if (form.validate()) return;
    onSearch(form.buildSearchParams());
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <header className="flex items-center gap-2 border-b px-4 py-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            返回
          </Button>
          <h2 className="flex-1 text-center text-base font-semibold">修改城市</h2>
          <span className="w-12" />
        </header>

        {form.isLoading && (
          <p className="p-4 text-sm text-muted-foreground">加载城市数据…</p>
        )}

        {form.error && (
          <p className="p-4 text-sm text-destructive">{formatApiError(form.error)}</p>
        )}

        {!form.isLoading && !form.error && (
          <div className="flex flex-1 flex-col p-4">
            <FlightSearchFields form={form} className="flex-1" />

            <Button className="mt-auto h-11 w-full text-base" onClick={handleSubmit}>
              搜索
            </Button>
          </div>
        )}
      </div>

      <FlightCityPickerHostFromForm form={form} />
    </>
  );
}
