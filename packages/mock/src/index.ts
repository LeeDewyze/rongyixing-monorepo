import { createAccountMockHandlers } from "./handlers/account.js";
import { createApprovalMockHandlers } from "./handlers/approval.js";
import { createAuthMockHandlers } from "./handlers/auth.js";
import { createFlightMockHandlers } from "./handlers/flight.js";
import { createHotelMockHandlers } from "./handlers/hotel.js";
import { createMemberMockHandlers } from "./handlers/member.js";
import { createPassengerMockHandlers } from "./handlers/passenger.js";
import { createOrderMockHandlers } from "./handlers/order.js";
import { createTrainMockHandlers } from "./handlers/train.js";
import { createTmcMockHandlers } from "./handlers/tmc.js";
import { createTravelMockHandlers } from "./handlers/travel.js";
import { createMockHandler, createMockRegistry } from "./registry.js";

export { createAuthMockHandlers, MOCK_IDENTITY, MOCK_LOGIN_RESULT } from "./handlers/auth.js";
export { createFlightMockHandlers } from "./handlers/flight.js";
export { MOCK_AIRPORTS } from "./fixtures/flight.js";
export { createHotelMockHandlers, resetHotelMockStore } from "./handlers/hotel.js";
export { createPassengerMockHandlers, MOCK_STAFF } from "./handlers/passenger.js";
export { createMemberMockHandlers, MOCK_PASSENGERS } from "./handlers/member.js";
export { createOrderMockHandlers } from "./handlers/order.js";
export { createTrainMockHandlers } from "./handlers/train.js";
export { createTravelMockHandlers } from "./handlers/travel.js";
export {
  createMockHandler,
  createMockRegistry,
  type MockHandlerFn,
  type MockRegistry,
} from "./registry.js";

function mergeHandlers(...maps: Record<string, import("./registry.js").MockHandlerFn>[]) {
  return Object.assign({}, ...maps);
}

/** Default registry with S1–S5 domain handlers. */
export function createDefaultMockRegistry() {
  return createMockRegistry(
    mergeHandlers(
      createApprovalMockHandlers(),
      createAccountMockHandlers(),
      createAuthMockHandlers(),
      createHotelMockHandlers(),
      createOrderMockHandlers(),
      createMemberMockHandlers(),
      createPassengerMockHandlers(),
      createTrainMockHandlers(),
      createTmcMockHandlers(),
      createTravelMockHandlers(),
      createFlightMockHandlers(),
    ),
  );
}

export function createDefaultMockHandler() {
  return createMockHandler(createDefaultMockRegistry());
}

/** List all registered mock method keys (for coverage check). */
export function listDefaultMockMethods(): string[] {
  return Object.keys(
    mergeHandlers(
      createApprovalMockHandlers(),
      createAccountMockHandlers(),
      createAuthMockHandlers(),
      createHotelMockHandlers(),
      createOrderMockHandlers(),
      createMemberMockHandlers(),
      createPassengerMockHandlers(),
      createTrainMockHandlers(),
      createTmcMockHandlers(),
      createTravelMockHandlers(),
      createFlightMockHandlers(),
    ),
  );
}
