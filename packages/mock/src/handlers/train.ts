import type { IResponse } from "@ryx/shared-types";
import { TrainSeatType } from "@ryx/shared-types";
import { TRAIN_FLOW_METHODS, successResponse } from "@ryx/api";

import {
  createMockTrainInitBookResponse,
  createMockTrainBookResponse,
} from "../fixtures/train-book.js";
import { createMockTrainOrderDetailLegacy } from "../fixtures/order.js";
import { createMockTrainScheduleStops } from "../fixtures/train-schedule.js";
import { createMockTrainList, MOCK_TRAIN_STATIONS } from "../fixtures/train.js";

type PolicyTrainEntity = {
  TrainNo?: string;
  Seats?: { SeatType?: number; SeatTypeName?: string }[];
};

function createMockTrainPolicy(passengerIds: string[], trains: PolicyTrainEntity[]) {
  const policies = trains.flatMap((train) =>
    (train.Seats ?? []).map((seat) => {
      const isSoftBerth = seat.SeatType === TrainSeatType.SoftBerth || seat.SeatTypeName === "软卧";
      const isBusinessBerth =
        seat.SeatType === TrainSeatType.BusinessBerthDown ||
        seat.SeatType === TrainSeatType.BusinessBerthUp ||
        seat.SeatTypeName === "动卧";
      if (isSoftBerth || isBusinessBerth) {
        return {
          TrainNo: train.TrainNo,
          SeatType:
            seat.SeatType ??
            (isBusinessBerth ? TrainSeatType.BusinessBerthDown : TrainSeatType.SoftBerth),
          IsAllowBook: false,
          Rules: ["违反座位类型"],
          Descriptions: ["超标"],
        };
      }
      return {
        TrainNo: train.TrainNo,
        SeatType: seat.SeatType,
        IsAllowBook: true,
        Rules: [] as string[],
      };
    }),
  );

  return passengerIds.map((passengerKey) => ({
    PassengerKey: passengerKey,
    TrainPolicies: policies,
  }));
}

export function createTrainMockHandlers(): Record<string, (data: unknown) => IResponse<unknown>> {
  return {
    [TRAIN_FLOW_METHODS.RESOURCE_STATION]: () => successResponse(MOCK_TRAIN_STATIONS),
    [TRAIN_FLOW_METHODS.HOME_SEARCH]: (data) => {
      const params = data as {
        Date?: string;
        FromStation?: string;
        ToStation?: string;
      };
      const from = MOCK_TRAIN_STATIONS.find((s) => s.Code === params.FromStation);
      const to = MOCK_TRAIN_STATIONS.find((s) => s.Code === params.ToStation);
      return successResponse({
        Trains: createMockTrainList({
          Date: params.Date ?? new Date().toISOString().slice(0, 10),
          FromStation: params.FromStation ?? "BJP",
          ToStation: params.ToStation ?? "SHH",
          FromName: from?.Name,
          ToName: to?.Name,
        }),
      });
    },
    [TRAIN_FLOW_METHODS.POLICY]: (data) => {
      const payload = data as { Passengers?: string; Trains?: string };
      const passengerIds = (payload.Passengers ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      let trains: PolicyTrainEntity[] = [];
      try {
        trains = JSON.parse(payload.Trains ?? "[]") as PolicyTrainEntity[];
      } catch {
        trains = [];
      }
      return successResponse(createMockTrainPolicy(passengerIds, trains));
    },
    [TRAIN_FLOW_METHODS.INIT]: () => successResponse(createMockTrainInitBookResponse()),
    [TRAIN_FLOW_METHODS.BOOK]: () => successResponse(createMockTrainBookResponse()),
    [TRAIN_FLOW_METHODS.EXCHANGE_BOOK]: () => successResponse(createMockTrainBookResponse()),
    [TRAIN_FLOW_METHODS.SCHEDULE]: (data) => {
      const params = data as { TrainCode?: string };
      return successResponse({
        Stops: createMockTrainScheduleStops(params?.TrainCode ?? "G1"),
      });
    },
    [TRAIN_FLOW_METHODS.GET_EXCHANGE_INFO]: (data) => {
      const params = data as { TicketId?: string };
      const ticketId = params?.TicketId ?? "207600000001";
      const detail = createMockTrainOrderDetailLegacy("ORD-TRN-002");
      const order = (detail as { Order?: Record<string, unknown> }).Order;
      const tickets = (order?.OrderTrainTickets as Array<Record<string, unknown>> | undefined) ?? [];
      const ticket =
        tickets.find((item) => String(item.Id) === ticketId) ?? tickets[0];
      const trip = ((ticket?.OrderTrainTrips as Array<Record<string, unknown>> | undefined) ?? [])[0];
      return successResponse({
        TicketId: ticketId,
        OrderId: order?.Id,
        Date: typeof trip?.StartTime === "string" ? trip.StartTime.slice(0, 10) : "2026-06-28",
        FromStation: "VNP",
        ToStation: "AOH",
        FromStationName: trip?.FromStationName ?? "北京南",
        ToStationName: trip?.ToStationName ?? "上海虹桥",
      });
    },
    [TRAIN_FLOW_METHODS.GET_TRAIN_PASSENGER]: (data) => {
      const params = data as { TicketId?: string };
      const ticketId = params?.TicketId ?? "207600000001";
      const detail = createMockTrainOrderDetailLegacy("ORD-TRN-002");
      const order = (detail as { Order?: Record<string, unknown> }).Order;
      const tickets = (order?.OrderTrainTickets as Array<Record<string, unknown>> | undefined) ?? [];
      const ticket =
        tickets.find((item) => String(item.Id) === ticketId) ?? tickets[0];
      const trip = ((ticket?.OrderTrainTrips as Array<Record<string, unknown>> | undefined) ?? [])[0];
      const passenger = (ticket?.Passenger as Record<string, unknown> | undefined) ?? {};
      const passengers =
        (order?.OrderPassengers as Array<Record<string, unknown>> | undefined) ?? [];
      const fullPassenger =
        passengers.find((item) => String(item.Id) === String(passenger.Id)) ?? passenger;
      return successResponse({
        Passenger: fullPassenger,
        Trip: trip,
        TrainCode: trip?.TrainCode,
        FromStationName: trip?.FromStationName,
        ToStationName: trip?.ToStationName,
        StartTime: trip?.StartTime,
      });
    },
  };
}
