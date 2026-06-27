import type { ReactNode } from "react";

import type { OrderAction, OrderListItem } from "@ryx/shared-types";
import { OrderListTabId } from "@ryx/shared-types";

import { ORDER_CARD_BODY_GRADIENT, ORDER_FONT } from "@/config/order-assets";
import { getOrderActions, shouldGrayPrice, shouldShowTicketStatus } from "@/lib/order-status";

import { OrderActionBar } from "./OrderActionBar";
import { OrderProductIcon } from "./OrderProductIcon";
import { OrderStatusBadge } from "./OrderStatusBadge";

interface OrderListCardProps {
  item: OrderListItem;
  onAction?: (action: OrderAction, item: OrderListItem) => void;
  onCardClick?: (item: OrderListItem) => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <p className={`text-[14px] font-normal leading-none text-[#666666] ${ORDER_FONT}`}>
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
          className={`min-w-0 flex-1 text-[15px] font-medium leading-none text-brand-title ${ORDER_FONT}`}
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
          className={`min-w-0 flex-1 text-[15px] font-medium leading-none text-brand-title ${ORDER_FONT}`}
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
          ticketStatusName={shouldShowTicketStatus(item) ? item.TicketStatusName : undefined}
        />
      );
    case OrderListTabId.Train:
      return (
        <TrainBody
          routeTitle={item.RouteTitle}
          departTime={item.DepartTime}
          passengerNames={item.PassengerNames}
          ticketStatusName={shouldShowTicketStatus(item) ? item.TicketStatusName : undefined}
        />
      );
    case OrderListTabId.Hotel:
      return (
        <>
          <p className={`text-[15px] font-medium leading-snug text-brand-title ${ORDER_FONT}`}>
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
        <p className={`text-[15px] font-medium text-brand-title ${ORDER_FONT}`}>
          {item.ServiceTitle ?? "用车订单"}
        </p>
      );
    default: {
      const _exhaustive: never = item;
      return _exhaustive;
    }
  }
}

export function OrderListCard({ item, onAction, onCardClick }: OrderListCardProps) {
  const actions = getOrderActions(item);
  const grayPrice = shouldGrayPrice(item);
  const clickable = Boolean(onCardClick);

  return (
    <article
      className="w-full overflow-hidden rounded-[8px] bg-white p-3"
      onClick={() => onCardClick?.(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onCardClick?.(item);
        }
      }}
      role={onCardClick ? "button" : undefined}
      tabIndex={onCardClick ? 0 : undefined}
    >
      <header className="flex items-center gap-2">
        <OrderProductIcon tabId={item.tabId} />
        <p
          className={`min-w-0 flex-1 truncate text-[14px] font-medium leading-none text-brand-title ${ORDER_FONT}`}
        >
          订单编号：{item.OrderNumber ?? item.OrderId}
        </p>
        <OrderStatusBadge label={item.StatusName} variant="order" />
      </header>

      {clickable ? (
        <button
          type="button"
          className="mt-3 w-full rounded-[8px] p-3 text-left active:opacity-90"
          style={{ background: ORDER_CARD_BODY_GRADIENT }}
          onClick={() => onCardClick?.(item)}
        >
          {renderBody(item)}
        </button>
      ) : (
        <div className="mt-3 rounded-[8px] p-3" style={{ background: ORDER_CARD_BODY_GRADIENT }}>
          {renderBody(item)}
        </div>
      )}

      <footer className="mt-3 flex items-center justify-between gap-3">
        <p
          className={`leading-none ${ORDER_FONT} ${
            grayPrice
              ? "text-[24px] font-medium text-[#8E8E93]"
              : "text-[24px] font-medium text-[#FF383C]"
          }`}
        >
          ¥{item.TotalAmount ?? "-"}
        </p>
        <OrderActionBar actions={actions} onAction={(action) => onAction?.(action, item)} />
      </footer>
    </article>
  );
}
