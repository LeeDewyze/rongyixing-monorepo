import type {
  FlightBookPassengerDto,
  FlightFare,
  FlightFareBasic,
  FlightOrderBookDto,
  FlightSegment,
} from "@ryx/shared-types";

function stripFareBasics(
  basics: FlightFareBasic[] | undefined,
): FlightFareBasic[] | undefined {
  return basics?.map((basic) => {
    const next = { ...basic, flightAndTaxFeesInfos: null as null };
    delete (next as { flightAndTaxFeesInfos?: unknown }).flightAndTaxFeesInfos;
    return next;
  });
}

function stripFlightCabin(cabin: FlightFare | undefined): FlightFare | undefined {
  if (!cabin) return cabin;
  return {
    ...cabin,
    Variables: null as unknown as undefined,
    FlightFareBasics: stripFareBasics(cabin.FlightFareBasics),
  };
}

function stripFlightSegment(segment: FlightSegment): FlightSegment {
  const next: FlightSegment & {
    totalSegments?: null;
    transferSegments?: null;
    flightListResult?: null;
    detailResultForVerify?: null;
    detailResult?: null;
    DetailKey?: unknown;
    Data?: unknown;
    BookType?: unknown;
    Cabins?: FlightFare[];
  } = {
    ...segment,
    totalSegments: null,
    transferSegments: null,
    flightListResult: null,
    detailResultForVerify: null,
    detailResult: null,
  };
  delete next.detailResultForVerify;
  delete next.DetailKey;
  delete next.Data;
  delete next.BookType;
  if (next.Cabins) {
    next.Cabins = next.Cabins.map((cabin) => stripFlightCabin(cabin) as FlightFare);
  }
  return next;
}

function stripPassenger(passenger: FlightBookPassengerDto): FlightBookPassengerDto {
  const next: FlightBookPassengerDto = { ...passenger };

  if (next.FlightSegment) {
    next.FlightSegment = stripFlightSegment(next.FlightSegment);
  }

  if (next.FlightSegments) {
    next.FlightSegments = next.FlightSegments.map(stripFlightSegment);
  }

  if (next.Policy) {
    next.Policy = {
      ...next.Policy,
      FlightDescription: null,
      TrainDescription: null,
      TrainSeatType: null,
      TrainSeatTypeName: null,
      TrainUpperSeatType: null,
      TrainUpperSeatTypeArray: null,
      TrainUpperSeatTypeName: null,
      HotelDescription: null,
      Setting: null,
    };
  }

  next.FlightCabin = stripFlightCabin(next.FlightCabin);

  return next;
}

/** Strip heavy fields before Initialize/Book — aligned with Legacy `getInitializeBookDto`. */
export function stripFlightOrderBookDto(dto: FlightOrderBookDto): FlightOrderBookDto {
  const passengers = dto.Passengers.map(stripPassenger);
  const travelFormId =
    dto.TravelFormId ?? passengers.find((p) => p.travelFormId)?.travelFormId;

  return {
    ...dto,
    TravelFormId: travelFormId,
    Passengers: passengers,
  };
}
