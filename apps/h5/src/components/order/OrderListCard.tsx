import type { ReactNode } from "react";

import type { OrderAction, OrderListItem } from "@ryx/shared-types";
import { OrderListTabId } from "@ryx/shared-types";

import { ORDER_CARD_BODY_GRADIENT, ORDER_FONT } from "@/config/order-assets";
import { getOrderActions, shouldGrayPrice } from "@/lib/order-status";

import { OrderActionBar } from "./OrderActionBar";
import { OrderProductIcon } from "./OrderProductIcon";
import { OrderStatusBadge } from "./OrderStatusBadge";

interface OrderListCardProps {
  item: OrderListItem;
  onAction?: (action: OrderAction) => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <p className={`text-[13px] font-normal leading-[1.4] text-[#666666] ${ORDER_FONT}`}>
      {label}：{value}
    </p>
  );
}

function TransportBody({
  routeTitle,
  departTime,
  passengerNames,
  ticketStatusName,
}: {
  routeTitle: string;
  departTime: string;
  passengerNames: string;
  ticketStatusName?: string;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <p
          className={`min-w-0 flex-1 text-[15px] font-medium leading-snug text-[#010101] ${ORDER_FONT}`}
        >
          {routeTitle}
        </p>
        {ticketStatusName ? <OrderStatusBadge label={ticketStatusName} variant="ticket" /> : null}
      </div>
      <div className="mt-2 space-y-1">
        <DetailRow label="起飞时间" value={departTime} />
        <DetailRow label="旅客姓名" value={passengerNames} />
      </div>
    </>
  );
}

function TrainBody({
  routeTitle,
  departTime,
  passengerNames,
  ticketStatusName,
}: {
  routeTitle: string;
  departTime: string;
  passengerNames: string;
  ticketStatusName?: string;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <p
          className={`min-w-0 flex-1 text-[15px] font-medium leading-snug text-[#010101] ${ORDER_FONT}`}
        >
          {routeTitle}
        </p>
        {ticketStatusName ? <OrderStatusBadge label={ticketStatusName} variant="ticket" /> : null}
      </div>
      <div className="mt-2 space-y-1">
        <DetailRow label="发车时间" value={departTime} />
        <DetailRow label="旅客姓名" value={passengerNames} />
      </div>
    </>
  );
}

function renderBody(item: OrderListItem): ReactNode {
  switch (item.tabId) {
    case OrderListTabId.Flight:
      return (
        <TransportBody
          routeTitle={item.RouteTitle}
          departTime={item.DepartTime}
          passengerNames={item.PassengerNames}
          ticketStatusName={item.TicketStatusName}
        />
      );
    case OrderListTabId.Train:
      return (
        <TrainBody
          routeTitle={item.RouteTitle}
          departTime={item.DepartTime}
          passengerNames={item.PassengerNames}
          ticketStatusName={item.TicketStatusName}
        />
      );
    case OrderListTabId.Hotel:
      return (
        <>
          <p className={`text-[15px] font-medium leading-snug text-[#010101] ${ORDER_FONT}`}>
            {item.HotelName}
          </p>
          <div className="mt-2 space-y-1">
            <DetailRow
              label="入住时间"
              value={`${item.CheckInDate}至${item.CheckOutDate} ${item.Nights}晚`}
            />
            <DetailRow label="入住房型" value={item.RoomType} />
            <DetailRow label="旅客姓名" value={item.PassengerNames} />
          </div>
        </>
      );
    case OrderListTabId.Car:
      return (
        <p className={`text-[15px] font-medium text-[#010101] ${ORDER_FONT}`}>
          {item.ServiceTitle ?? "用车订单"}
        </p>
      );
    default: {
      const _exhaustive: never = item;
      return _exhaustive;
    }
  }
}

export function OrderListCard({ item, onAction }: OrderListCardProps) {
  const actions = getOrderActions(item);
  const grayPrice = shouldGrayPrice(item);

  return (
    <article className="overflow-hidden rounded-lg bg-white p-3">
      <header className="flex items-center gap-2">
        <OrderProductIcon tabId={item.tabId} />
        <p className={`min-w-0 flex-1 truncate text-[13px] text-[#010101] ${ORDER_FONT}`}>
          订单编号：{item.OrderNumber ?? item.OrderId}
        </p>
        <OrderStatusBadge label={item.StatusName} variant="order" />
      </header>

      <div className="mt-3 rounded-lg p-3" style={{ background: ORDER_CARD_BODY_GRADIENT }}>
        {renderBody(item)}
      </div>

      <footer className="mt-3 flex items-center justify-between gap-3">
        <p
          className={`text-[20px] font-semibold leading-none ${ORDER_FONT} ${
            grayPrice ? "text-[#9CA3AF]" : "text-[#FF4D4F]"
          }`}
        >
          ¥{item.TotalAmount ?? "-"}
        </p>
        <OrderActionBar actions={actions} onAction={onAction} />
      </footer>
    </article>
  );
}
