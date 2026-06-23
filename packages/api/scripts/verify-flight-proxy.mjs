#!/usr/bin/env node
/**
 * Proxy smoke test: login → list → detail → initialize → (optional) book.
 *
 * Usage:
 *   FLIGHT_PROXY_USER=T18610773065 FLIGHT_PROXY_PASS=Temp123456 \
 *     node packages/api/scripts/verify-flight-proxy.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createApi, stripFlightOrderBookDto } from "../dist/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(__dirname, "../../../docs/api/fixtures/flight-proxy");

const USER = process.env.FLIGHT_PROXY_USER ?? "T18610773065";
const PASS = process.env.FLIGHT_PROXY_PASS ?? "Temp123456";
const DATE = process.env.FLIGHT_PROXY_DATE ?? "2026-06-23";
const FROM = process.env.FLIGHT_PROXY_FROM ?? "BJS";
const TO = process.env.FLIGHT_PROXY_TO ?? "SHA";
const FLIGHT_HINT = process.env.FLIGHT_PROXY_FLIGHT ?? "";
const SUBMIT_BOOK = process.env.FLIGHT_PROXY_SUBMIT === "1";

function log(step, data) {
  console.log(`\n=== ${step} ===`);
  console.log(JSON.stringify(data, null, 2).slice(0, 4000));
}

function save(name, data) {
  mkdirSync(FIXTURE_DIR, { recursive: true });
  const path = join(FIXTURE_DIR, `${name}.json`);
  writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
  console.log(`saved ${path}`);
}

let ticket = "";

const api = createApi({
  baseUrl: process.env.FLIGHT_PROXY_BASE ?? "http://127.0.0.1:5173",
  mode: "proxy",
  appId: "com.ronglvonline.app",
  getTicket: () => ticket,
  getTicketName: () => "ticket",
  getDomain: () => "rtesp.com",
  getLanguage: () => "cn",
  getExtraFields: () => ({ root: "rl", IsShowLoading: "true" }),
});

function resolveSegmentId(seg, view) {
  if (seg?.Id) return seg.Id;
  if (view?.FlightNos) return view.FlightNos;
  const detailKey = seg?.DetailKey ?? seg?.Data ?? view?.Data;
  if (detailKey) return detailKey;
  const flightNumber = seg?.Number || seg?.FlightNumber || "";
  if (flightNumber && seg?.TakeoffTime) return `${flightNumber}-${seg.TakeoffTime}`;
  return flightNumber || "unknown";
}

function normalizeSegments(list) {
  if (list?.FlightViews?.length) {
    return list.FlightViews.map((view) => {
      const seg = view.Segment;
      if (!seg) return null;
      const detailKey = seg.DetailKey ?? seg.Data ?? view.Data;
      return {
        ...seg,
        Id: resolveSegmentId({ ...seg, DetailKey: detailKey, Data: seg.Data ?? view.Data }, view),
        LowestFare: seg.LowestFare ?? view.Price,
        Number: seg.Number || seg.FlightNumber || "",
        FlightNumber: seg.FlightNumber || seg.Number || "",
        Data: seg.Data ?? view.Data,
        DetailKey: detailKey,
        BookType: seg.BookType ?? view.BookType,
      };
    }).filter(Boolean);
  }
  return list?.Result?.FlightSegments ?? [];
}

function pickSegments(list) {
  const segments = normalizeSegments(list);
  const hinted = FLIGHT_HINT
    ? segments.filter((s) =>
        (s.Number || s.FlightNumber || "").toLowerCase().includes(FLIGHT_HINT.toLowerCase()),
      )
    : [];
  const direct = segments.filter((s) => !s.IsTransfer && !s.IsStop);
  const pool = hinted.length ? hinted : direct.length ? direct : segments;
  return pool.sort(
    (a, b) => Number(a.LowestFare ?? 99999) - Number(b.LowestFare ?? 99999),
  );
}

function pickBookableFare(detail, flightNumber) {
  const fares = detail?.FlightFares ?? [];
  const matched = flightNumber
    ? fares.filter((f) =>
        (f.FlightNumber ?? "").toLowerCase().includes(flightNumber.toLowerCase()),
      )
    : fares;
  const pool = matched.length ? matched : fares;
  return (
    pool.find((f) => f.IsAllowOrder !== false) ??
    pool.sort((a, b) => Number(a.SalesPrice ?? 0) - Number(b.SalesPrice ?? 0))[0]
  );
}

function buildOrderBookDto({ segments, fare, passenger }) {
  const flightSegments = (segments?.length ? segments : []).map((segment) => {
    const flightNumber = segment.Number || segment.FlightNumber || "";
    return { ...segment, Number: flightNumber, FlightNumber: flightNumber };
  });
  const primary = flightSegments[0] ?? {};
  return stripFlightOrderBookDto({
    Passengers: [
      {
        ClientId: passenger.accountId,
        FlightSegments: flightSegments.length ? flightSegments : [primary],
        FlightCabin: { ...fare },
        Credentials: {
          Id: passenger.credentialId,
          Name: passenger.name,
          Mobile: passenger.mobile,
          Number: passenger.number,
          Type: passenger.type,
          CredentialsType: passenger.type,
          Account: { Id: passenger.accountId },
        },
        Mobile: passenger.mobile,
      },
    ],
    Linkmans: [{ Name: passenger.name, Mobile: passenger.mobile }],
  });
}

async function resolvePassenger() {
  const staff = await api.passenger.getStaffList({ PageIndex: 1, PageSize: 20, IsRyx: true });
  const pick =
    staff.Staffs?.find((s) => s.Name === "申晓杰") ??
    staff.Staffs?.find((s) => s.Name?.includes("申")) ??
    staff.Staffs?.[0];
  if (!pick) throw new Error("No staff in list");

  const accountId = pick.AccountId ?? pick.Id;
  const creds = await api.passenger.getStaffCredentials({ AccountId: accountId });
  if (!creds?.length) throw new Error(`No credentials for staff ${pick.Name}`);
  const cred = creds.find((c) => c.CredentialsType === 1 || c.Type === 1) ?? creds[0];
  return {
    accountId,
    credentialId: cred.Id,
    name: cred.Name ?? pick.Name,
    mobile: cred.Mobile ?? pick.Mobile ?? "",
    number: cred.Number ?? "",
    type: cred.CredentialsType ?? cred.Type ?? 1,
  };
}

async function main() {
  const login = await api.authProxy.login({
    Name: USER,
    Password: PASS,
    Device: "proxy-verify-script",
    DeviceName: "proxy-verify-script",
  });
  ticket = login.Ticket ?? "";
  if (!ticket) throw new Error("Login failed: no Ticket");
  log("login", { Ticket: ticket.slice(0, 12) + "…", Name: login.Name });

  await api.proxy.loadApiConfig();

  const list = await api.flight.searchFlights({
    Date: DATE,
    FromCode: FROM,
    ToCode: TO,
    FromAsAirport: false,
    ToAsAirport: false,
  });
  save("home-index-response", list);

  const candidates = pickSegments(list);
  if (!candidates.length) throw new Error("No flight segments in list");

  const passenger = await resolvePassenger();
  log("passenger", passenger);

  let picked = null;
  let detail = null;
  let fare = null;

  for (const segment of candidates.slice(0, 8)) {
    const flightNumber = segment.Number || segment.FlightNumber || "";
    try {
      const nextDetail = await api.flight.getFlightDetail({
        Date: DATE.slice(0, 10),
        FromCode: FROM,
        ToCode: TO,
        FlightNumber: flightNumber,
        FromAsAirport: false,
        ToAsAirport: false,
        ADTPtcs: 1,
        DetailKey: segment.DetailKey ?? segment.Data,
        BookType: segment.BookType != null ? String(segment.BookType) : undefined,
      });
      const nextFare = pickBookableFare(nextDetail, flightNumber);
      if (!nextFare) continue;
      picked = segment;
      detail = nextDetail;
      fare = nextFare;
      if (nextFare.IsAllowOrder !== false) break;
    } catch (err) {
      console.warn(`detail failed for ${flightNumber}:`, err.message ?? err);
    }
  }

  if (!picked || !detail || !fare) throw new Error("Could not load detail/fare for any segment");

  save("home-detail-response", detail);
  log("picked-segment", {
    id: picked.Id,
    flightNumber: picked.Number || picked.FlightNumber,
    IsTransfer: picked.IsTransfer,
    LowestFare: picked.LowestFare,
    DetailKey: (picked.DetailKey ?? picked.Data ?? "").slice(0, 40) + "…",
  });
  log("picked-fare", {
    Code: fare.Code,
    SalesPrice: fare.SalesPrice,
    IsAllowOrder: fare.IsAllowOrder,
    Count: fare.Count,
  });

  const initParams = buildOrderBookDto({
    segments: detail.FlightSegments?.length ? detail.FlightSegments : [picked],
    fare,
    passenger,
  });
  save("initialize-request", initParams);

  let initRes;
  try {
    initRes = await api.flight.initializeBook(initParams);
    save("initialize-response", initRes);
    log("initialize-OK", initRes);
  } catch (err) {
    save("initialize-error", { message: String(err), params: initParams });
    throw err;
  }

  if (SUBMIT_BOOK) {
    const bookRes = await api.flight.submitBook(initParams);
    save("book-response", bookRes);
    log("book-OK", bookRes);
  } else {
    console.log("\n(skip book — set FLIGHT_PROXY_SUBMIT=1 to submit)");
  }
}

main().catch((err) => {
  console.error("\nFAILED:", err);
  process.exit(1);
});
