import { useNavigate } from "react-router-dom";
import { ProductType } from "@ryx/shared-types";
import { Button } from "@ryx/ui/components/ui/button";
import { Card, CardContent } from "@ryx/ui/components/ui/card";

import { FlightCityPickerHostFromForm, FlightSearchFields } from "@/components/flight/common";
import { SearchPageLayout, SearchPassengerButton } from "@/components/search";
import { useFlightSearchForm } from "@/hooks/useFlightSearchForm";
import { formatApiError } from "@/lib/formatApiError";

export function FlightSearchPage() {
  const navigate = useNavigate();
  const form = useFlightSearchForm();

  function handleSearch() {
    if (form.validate()) return;
    navigate(`/flight/list?${form.buildSearchParams().toString()}`);
  }

  if (form.isLoading) {
    return <p className="p-4 text-muted-foreground">加载中…</p>;
  }

  if (form.error) {
    return <p className="p-4 text-destructive">{formatApiError(form.error)}</p>;
  }

  return (
    <SearchPageLayout
      title="机票"
      subtitle="因公出行 · 国内航班"
      theme="sky"
      headerRight={<SearchPassengerButton forType={ProductType.Flight} returnTo="/flight" />}
    >
      <Card className="overflow-hidden shadow-lg">
        <CardContent className="space-y-5 p-4 pt-5">
          <FlightSearchFields form={form} />
          <Button className="h-11 w-full text-base" onClick={handleSearch}>
            查询航班
          </Button>
        </CardContent>
      </Card>

      <FlightCityPickerHostFromForm form={form} />
    </SearchPageLayout>
  );
}
