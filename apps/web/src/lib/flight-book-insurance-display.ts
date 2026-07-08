import type { FlightInsuranceProduct } from "@ryx/shared-types";

export function resolvePassengerInsuranceProducts(
  insurances:
    | Record<string, FlightInsuranceProduct[] | null>
    | FlightInsuranceProduct[]
    | undefined,
  passenger: { id: string; passenger: { AccountId?: string; Id?: string } },
): FlightInsuranceProduct[] {
  if (!insurances) return [];
  if (Array.isArray(insurances)) return insurances;

  const keys = [
    passenger.id,
    passenger.passenger.AccountId,
    passenger.passenger.Id,
  ].map((key) => (key != null ? String(key) : ""));

  for (const key of keys) {
    const list = insurances[key];
    if (list?.length) return list;
  }
  return [];
}

export function resolveInsuranceAmount(
  products: FlightInsuranceProduct[],
  selectedId: string,
): number {
  const selected = products.find((item) => String(item.Id ?? "") === selectedId);
  const price = Number(selected?.Price);
  return Number.isFinite(price) ? price : 0;
}
