import type {
  FlightBookPassengerDto,
  FlightFare,
  FlightOrderBookDto,
  PassengerBookInfo,
} from "@ryx/shared-types";

import type { FlightBookSelection } from "@/lib/flight-book-session";

function buildCabinRules(fare: FlightFare): Record<string, string> | undefined {
  const rules = fare.FlightFareRules;
  if (!rules?.length) return undefined;
  const map: Record<string, string> = {};
  for (const rule of rules) {
    const key = `${rule.Tag ?? rule.Name ?? "rule"}-${Object.keys(map).length}`;
    map[key] = rule.Description ?? rule.Name ?? "";
  }
  return map;
}

function prepareFlightCabin(fare: FlightFare): FlightFare & { Rules?: Record<string, string> } {
  const rules = buildCabinRules(fare);
  return rules ? { ...fare, Rules: rules } : { ...fare };
}

export function buildFlightOrderBookDto(input: {
  selection: FlightBookSelection;
  passengers: PassengerBookInfo[];
  travelFormId?: string;
  travelPayType?: number;
  linkman?: { name: string; mobile: string };
}): FlightOrderBookDto {
  const { selection, passengers, travelFormId, travelPayType, linkman } = input;
  const segment = { ...selection.segment };
  const flightCabin = prepareFlightCabin(selection.fare);

  const passengerDtos: FlightBookPassengerDto[] = passengers.map((info) => {
    const cred = info.credential;
    const accountId = info.passenger.AccountId ?? info.id;

    return {
      ClientId: accountId,
      FlightSegments: [segment],
      FlightCabin: flightCabin,
      Credentials: {
        Id: cred.Id,
        Name: cred.Name,
        Mobile: cred.Mobile,
        Number: cred.Number,
        Type: cred.CredentialsType ?? cred.Type,
        CredentialsType: cred.CredentialsType ?? cred.Type,
        Account: accountId ? { Id: accountId } : undefined,
      },
      Mobile: cred.Mobile,
      TravelPayType: travelPayType,
      travelFormId:
        travelFormId ??
        ("travelFormId" in info.passenger ? info.passenger.travelFormId : undefined),
    };
  });

  const dto: FlightOrderBookDto = {
    TravelFormId: travelFormId,
    Passengers: passengerDtos,
    TravelPayType: travelPayType,
  };

  if (linkman?.name && linkman.mobile) {
    dto.Linkmans = [
      {
        Name: linkman.name,
        Mobile: linkman.mobile,
      },
    ];
  }

  return dto;
}

export function resolveFlightBookOrderId(result: {
  TradeNo?: string;
  OrderId?: string;
}): string | undefined {
  const tradeNo = result.TradeNo;
  if (tradeNo && tradeNo !== "0") return tradeNo;
  return result.OrderId;
}

/** MVP 底部合计：仅舱位票价 × 人数，不含服务费/保险等 Initialize 附加项。 */
export function resolveFlightBookDisplayAmount(
  selection: FlightBookSelection,
  passengerCount: number,
): number {
  const unit = Number(selection.fare.SalesPrice ?? selection.fare.TicketPrice ?? 0);
  return unit * passengerCount;
}
