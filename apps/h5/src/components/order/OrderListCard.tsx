import type { ReactNode } from "react";

import type {
  OrderAction,
  OrderFlightListItem,
  OrderFlightListTicket,
  OrderListItem,
  OrderTrainListItem,
  OrderTrainListTicket,
} from "@ryx/shared-types";
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

function TrainTicketBlock({
  ticket,
  showStatus,
  onAction,
}: {
  ticket: OrderTrainListTicket;
  showStatus: boolean;
  onAction?: (action: OrderAction, ticket: OrderTrainListTicket) => void;
}) {
  return (
    <div className="border-b border-black/5 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <div className="flex items-start justify-between gap-2">
        <p
          className={`min-w-0 flex-1 text-[15px] font-medium leading-snug text-brand-title ${ORDER_FONT}`}
        >
          {ticket.RouteTitle}
        </p>
        {showStatus && ticket.TicketStatusName ? (
          <OrderStatusBadge label={ticket.TicketStatusName} variant="ticket" />
        ) : null}
      </div>
      <div className="mt-2 space-y-1">
        <DetailRow label="发车时间" value={ticket.DepartTime} />
        <DetailRow label="旅客姓名" value={ticket.PassengerNames} />
      </div>
      {(ticket.Actions?.length ?? 0) > 0 ? (
        <div className="mt-3 flex items-center justify-end">
          <OrderActionBar
            actions={ticket.Actions ?? []}
            onAction={(action) => onAction?.(action, ticket)}
          />
        </div>
      ) : null}
    </div>
  );
}

function TicketNotice({ ticket }: { ticket: OrderFlightListTicket }) {
  if (ticket.IsCustomApplyRefunding) {
    return <span className={`text-[13px] text-[#8E8E93] ${ORDER_FONT}`}>退票申请中</span>;
  }
  if (ticket.IsCustomApplyExchanging) {
    return <span className={`text-[13px] text-[#8E8E93] ${ORDER_FONT}`}>改签申请中</span>;
  }
  return null;
}

function FlightTicketBlock({
  ticket,
  showStatus,
  onAction,
}: {
  ticket: OrderFlightListTicket;
  showStatus: boolean;
  onAction?: (action: OrderAction, ticket: OrderFlightListTicket) => void;
}) {
  return (
    <div className="border-b border-black/5 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <div className="flex items-start justify-between gap-2">
        <p
          className={`min-w-0 flex-1 text-[15px] font-medium leading-snug text-brand-title ${ORDER_FONT}`}
        >
          {ticket.RouteTitle}
        </p>
        {showStatus && ticket.TicketStatusName ? (
          <OrderStatusBadge label={ticket.TicketStatusName} variant="ticket" />
        ) : null}
      </div>
      <div className="mt-2 space-y-1">
        <DetailRow label="起飞时间" value={ticket.DepartTime} />
        <DetailRow label="旅客姓名" value={ticket.PassengerNames} />
      </div>
      {(ticket.Actions?.length ?? 0) > 0 ||
      ticket.IsCustomApplyRefunding ||
      ticket.IsCustomApplyExchanging ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <TicketNotice ticket={ticket} />
          <OrderActionBar
            actions={ticket.Actions ?? []}
            onAction={(action) => onAction?.(action, ticket)}
          />
        </div>
      ) : null}
    </div>
  );
}

function FlightBody({
  item,
  onTicketAction,
}: {
  item: OrderFlightListItem;
  onTicketAction?: (action: OrderAction, ticket: OrderFlightListTicket) => void;
}) {
  const tickets = item.Tickets?.length
    ? item.Tickets
    : [
        {
          TicketId: item.TicketId ?? "",
          RouteTitle: item.RouteTitle,
          DepartTime: item.DepartTime,
          PassengerNames: item.PassengerNames,
          TicketStatusName: item.TicketStatusName,
        } satisfies OrderFlightListTicket,
      ];
  const showStatus = shouldShowTicketStatus(item);

  return (
    <div className="space-y-0">
      {tickets.map((ticket, index) => (
        <FlightTicketBlock
          key={ticket.TicketId || `${ticket.RouteTitle}-${index}`}
          ticket={ticket}
          showStatus={showStatus}
          onAction={onTicketAction}
        />
      ))}
    </div>
  );
}

function TrainBody({
  item,
  onTicketAction,
}: {
  item: OrderTrainListItem;
  onTicketAction?: (action: OrderAction, ticket: OrderTrainListTicket) => void;
}) {
  const tickets = item.Tickets?.length
    ? item.Tickets
    : [
        {
          TicketId: item.TicketId ?? "",
          RouteTitle: item.RouteTitle,
          DepartTime: item.DepartTime,
          PassengerNames: item.PassengerNames,
          TicketStatusName: item.TicketStatusName,
          Actions: item.Actions,
        } satisfies OrderTrainListTicket,
      ];
  const showStatus = shouldShowTicketStatus(item);

  return (
    <div className="space-y-0">
      {tickets.map((ticket, index) => (
        <TrainTicketBlock
          key={ticket.TicketId || `${ticket.RouteTitle}-${index}`}
          ticket={ticket}
          showStatus={showStatus}
          onAction={onTicketAction}
        />
      ))}
    </div>
  );
}

function renderBody(
  item: OrderListItem,
  onFlightTicketAction?: (action: OrderAction, ticket: OrderFlightListTicket) => void,
  onTrainTicketAction?: (action: OrderAction, ticket: OrderTrainListTicket) => void,
): ReactNode {
  switch (item.tabId) {
    case OrderListTabId.Flight:
      return <FlightBody item={item} onTicketAction={onFlightTicketAction} />;
    case OrderListTabId.Train:
      return <TrainBody item={item} onTicketAction={onTrainTicketAction} />;
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
  const handleFlightTicketAction = (action: OrderAction, ticket: OrderFlightListTicket) => {
    onAction?.(action, {
      ...item,
      TicketId: ticket.TicketId,
      RouteTitle: ticket.RouteTitle,
      DepartTime: ticket.DepartTime,
      PassengerNames: ticket.PassengerNames,
      TicketStatusName: ticket.TicketStatusName,
      Actions: ticket.Actions,
    } as OrderListItem);
  };
  const handleTrainTicketAction = (action: OrderAction, ticket: OrderTrainListTicket) => {
    onAction?.(action, {
      ...item,
      TicketId: ticket.TicketId,
      RouteTitle: ticket.RouteTitle,
      DepartTime: ticket.DepartTime,
      PassengerNames: ticket.PassengerNames,
      TicketStatusName: ticket.TicketStatusName,
      Actions: ticket.Actions,
    } as OrderListItem);
  };

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

      <div className="mt-3 rounded-[8px] p-3" style={{ background: ORDER_CARD_BODY_GRADIENT }}>
        {renderBody(item, handleFlightTicketAction, handleTrainTicketAction)}
      </div>

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
