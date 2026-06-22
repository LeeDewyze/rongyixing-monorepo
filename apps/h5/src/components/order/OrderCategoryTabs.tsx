import { useLayoutEffect, useRef, useState } from "react";
import type { OrderListScope } from "@ryx/shared-types";

import {
  ORDER_CATEGORY_TABS,
  ORDER_FONT,
  ORDER_SCOPE_TABS_TRACK,
  type OrderCategoryId,
} from "@/config/order-assets";

import "./order-category-tabs.css";

export type { OrderCategoryId };
export { ORDER_CATEGORY_TABS };

interface OrderCategoryTabsProps {
  activeId: OrderCategoryId;
  onChange: (id: OrderCategoryId) => void;
}

/** Fixed-pixel bump geometry (matches Figma 375×56 slices), unaffected by width. */
const BAR_HEIGHT = 56;
const RAIL_TOP = 48;
const TOP_RADIUS = 12.8;
const FLAT_HALF = 27;
const CURVE_WIDTH = 57.5;

/**
 * Two-cubic ogee control fractions sampled from 机票tab背景.svg
 * (flat-top end → rail), as fractions of CURVE_WIDTH (x) and RAIL_TOP (y).
 */
const OGEE = {
  seg1: { c1x: 0.246, c1y: 0, c2x: 0.452, c2y: 0.227, ex: 0.508, ey: 0.533 },
  seg2: { c1x: 0.578, c1y: 0.805, c2x: 0.772, c2y: 1, ex: 1, ey: 1 },
};

const n = (value: number): string => value.toFixed(2);

/** S-curve descending from a flat-top point outward to the rail line. */
function ogeeDown(xTop: number, dir: 1 | -1): string {
  const dx = (f: number) => xTop + dir * f * CURVE_WIDTH;
  const dy = (f: number) => f * RAIL_TOP;
  const { seg1, seg2 } = OGEE;
  return (
    ` C${n(dx(seg1.c1x))} ${n(dy(seg1.c1y))} ${n(dx(seg1.c2x))} ${n(dy(seg1.c2y))} ${n(dx(seg1.ex))} ${n(dy(seg1.ey))}` +
    ` C${n(dx(seg2.c1x))} ${n(dy(seg2.c1y))} ${n(dx(seg2.c2x))} ${n(dy(seg2.c2y))} ${n(dx(seg2.ex))} ${n(dy(seg2.ey))}`
  );
}

/** S-curve ascending from the rail line inward to a flat-top point (reverse ogee). */
function ogeeUp(xTop: number, dir: 1 | -1): string {
  const dx = (f: number) => xTop + dir * f * CURVE_WIDTH;
  const dy = (f: number) => f * RAIL_TOP;
  const { seg1, seg2 } = OGEE;
  return (
    ` C${n(dx(seg2.c2x))} ${n(dy(seg2.c2y))} ${n(dx(seg2.c1x))} ${n(dy(seg2.c1y))} ${n(dx(seg1.ex))} ${n(dy(seg1.ey))}` +
    ` C${n(dx(seg1.c2x))} ${n(dy(seg1.c2y))} ${n(dx(seg1.c1x))} ${n(dy(seg1.c1y))} ${n(xTop)} 0`
  );
}

/** Builds the white bump outline for the active tab in real pixels. */
function buildBumpPath(barWidth: number, count: number, activeIndex: number): string {
  const cellWidth = barWidth / count;
  const cx = (activeIndex + 0.5) * cellWidth;
  const innerL = cx - FLAT_HALF;
  const innerR = cx + FLAT_HALF;
  const outerL = innerL - CURVE_WIDTH;
  const outerR = innerR + CURVE_WIDTH;

  const isFirst = activeIndex === 0;
  const isLast = activeIndex === count - 1;

  if (isFirst) {
    return (
      `M0 ${BAR_HEIGHT} L0 ${n(TOP_RADIUS)} Q0 0 ${n(TOP_RADIUS)} 0 L${n(innerR)} 0` +
      ogeeDown(innerR, 1) +
      ` L${n(outerR)} ${BAR_HEIGHT} Z`
    );
  }

  if (isLast) {
    return (
      `M${n(barWidth)} ${BAR_HEIGHT} L${n(barWidth)} ${n(TOP_RADIUS)}` +
      ` Q${n(barWidth)} 0 ${n(barWidth - TOP_RADIUS)} 0 L${n(innerL)} 0` +
      ogeeDown(innerL, -1) +
      ` L${n(outerL)} ${BAR_HEIGHT} Z`
    );
  }

  return (
    `M${n(innerL)} 0` +
    ogeeDown(innerL, -1) +
    ` L${n(outerL)} ${BAR_HEIGHT} L${n(outerR)} ${BAR_HEIGHT} L${n(outerR)} ${RAIL_TOP}` +
    ogeeUp(innerR, 1) +
    ` Z`
  );
}

function OrderTabsBackground({ activeIndex, count }: { activeIndex: number; count: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    const update = () => setWidth(node.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="order-category-tabs__bg" aria-hidden>
      {width > 0 ? (
        <svg
          width={width}
          height={BAR_HEIGHT}
          viewBox={`0 0 ${width} ${BAR_HEIGHT}`}
          preserveAspectRatio="none"
          className="block"
        >
          <defs>
            <linearGradient id="order-tab-rail" x1="0" y1={RAIL_TOP} x2="0" y2={BAR_HEIGHT}>
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#f5f6f9" />
            </linearGradient>
          </defs>
          <rect
            x="0"
            y={RAIL_TOP}
            width={width}
            height={BAR_HEIGHT - RAIL_TOP}
            fill="url(#order-tab-rail)"
          />
          <path d={buildBumpPath(width, count, activeIndex)} fill="#ffffff" />
        </svg>
      ) : null}
    </div>
  );
}

export function OrderCategoryTabs({ activeId, onChange }: OrderCategoryTabsProps) {
  const activeIndex = ORDER_CATEGORY_TABS.findIndex((tab) => tab.id === activeId);

  return (
    <div className={`order-category-tabs ${ORDER_FONT}`}>
      <OrderTabsBackground
        activeIndex={Math.max(activeIndex, 0)}
        count={ORDER_CATEGORY_TABS.length}
      />
      <div className="order-category-tabs__list grid grid-cols-4">
        {ORDER_CATEGORY_TABS.map((tab) => {
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              className={`order-category-tab${active ? " order-category-tab--active" : ""}`}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
              <svg width="28" height="6" viewBox="0 0 28 6" className="mt-3 shrink-0" aria-hidden>
                <path
                  d="M2 1.5 Q14 6 26 1.5"
                  stroke={active ? "#2768FA" : "transparent"}
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface OrderScopeTabsProps {
  scope: OrderListScope;
  onChange: (scope: OrderListScope) => void;
}

const SCOPE_OPTIONS: { id: OrderListScope; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "pendingTravel", label: "待出行" },
];

export function OrderScopeTabs({ scope, onChange }: OrderScopeTabsProps) {
  return (
    <div
      className={`order-scope-tabs mx-3 mb-3 mt-2 flex h-10 p-1 ${ORDER_FONT}`}
      style={{ background: ORDER_SCOPE_TABS_TRACK }}
      role="tablist"
      aria-label="Order scope"
    >
      {SCOPE_OPTIONS.map((option) => {
        const active = scope === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`order-scope-tab${active ? " order-scope-tab--active" : ""}`}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
