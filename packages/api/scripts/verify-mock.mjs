#!/usr/bin/env node
/**
 * Smoke-test domain APIs in mock mode (no UI, no real network).
 *
 * Usage:
 *   pnpm verify:mock
 *   pnpm verify:mock hotel
 *   pnpm verify:mock auth order
 */
import { createApi } from "../dist/index.js";
import { createDefaultMockHandler } from "../../mock/dist/index.js";

const domains = process.argv.slice(2).filter((a) => a !== "--");
const runAll = domains.length === 0;

function ok(label, data) {
  console.log(`✓ ${label}`);
  const text = JSON.stringify(data, null, 2);
  const lines = text.split("\n");
  console.log(lines.slice(0, 8).join("\n"));
  if (lines.length > 8) console.log("  …");
}

async function runHotel(api) {
  const cities = await api.hotel.getCities();
  ok("hotel.getCities", cities);

  const list = await api.hotel.getList({ CityCode: "010" });
  ok("hotel.getList", list);

  const hotelId = list.Hotels?.[0]?.HotelId ?? "H10001";
  const detail = await api.hotel.getDetail({
    HotelId: hotelId,
    CheckInDate: "2026-06-20",
    CheckOutDate: "2026-06-21",
  });
  ok("hotel.getDetail", detail);

  const planId = detail.Rooms?.[0]?.Plans?.[0]?.PlanId ?? "P001";
  await api.hotel.initBook({
    HotelId: hotelId,
    PlanId: planId,
    CheckInDate: "2026-06-20",
    CheckOutDate: "2026-06-21",
    Passengers: [{ Name: "张三" }],
  });
  ok("hotel.initBook", { ok: true });

  const book = await api.hotel.submitBook({
    HotelId: hotelId,
    PlanId: planId,
    CheckInDate: "2026-06-20",
    CheckOutDate: "2026-06-21",
    Passengers: [{ Name: "张三", Mobile: "13800138001" }],
  });
  ok("hotel.submitBook", book);

  let order = await api.order.getDetail({ OrderId: book.OrderId });
  ok("order.getDetail (poll 1)", order);

  await new Promise((r) => setTimeout(r, 3200));
  order = await api.order.getDetail({ OrderId: book.OrderId });
  ok("order.getDetail (poll 2, expect isShowPayButton)", order);

  const pays = await api.pay.getOrderPays({ OrderId: book.OrderId });
  ok("pay.getOrderPays", pays);

  const pay = await api.pay.create({
    OrderId: book.OrderId,
    PayType: pays[0]?.PayType ?? "Wechat",
  });
  ok("pay.create", pay);
}

async function runAuth(api) {
  const login = await api.authProxy.login({ Name: "demo", Password: "123456" });
  ok("authProxy.login", login);
  ok("identity.get", await api.identity.get(login.Ticket));
  ok("authProxy.logout", { ok: await api.authProxy.logout() });
}

async function runOrder(api) {
  ok("order.getList", await api.order.getList({ PageIndex: 1 }));
}

async function runMember(api) {
  ok("member.getProfile", await api.member.getProfile());
  ok("member.getPassengerList", await api.member.getPassengerList());
}

async function runTravel(api) {
  ok("travel.getTravelUrl", await api.travel.getTravelUrl({ travelType: "Hotel" }));
  ok("travel.getTravelForms", await api.travel.getTravelForms({ travelType: "Hotel" }));
  ok("travel.getStaff", await api.travel.getStaff("S001"));
}

const api = createApi({
  baseUrl: "https://app.rongtrip.cn",
  mode: "mock",
  mockDelay: 0,
  mockHandler: createDefaultMockHandler(),
});

console.log("=== @ryx/api mock smoke test ===\n");

try {
  if (runAll || domains.includes("auth")) await runAuth(api);
  if (runAll || domains.includes("hotel")) await runHotel(api);
  if (runAll || domains.includes("order")) await runOrder(api);
  if (runAll || domains.includes("member")) await runMember(api);
  if (runAll || domains.includes("travel")) await runTravel(api);
  console.log("\n=== All checks passed ===");
} catch (err) {
  console.error("\n✗ Failed:", err instanceof Error ? err.message : err);
  process.exit(1);
}
