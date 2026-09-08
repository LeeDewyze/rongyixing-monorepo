import { getApi } from "@/lib/api";
import {
  FLIGHT_PAY_TYPE_CREDIT,
  FLIGHT_PAY_TYPE_PERSON,
} from "@/lib/flight-book-pay";

const POLL_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 3;
const CHECK_PAY_LOG_PREFIX = "[ryx][check-pay]";

export async function pollFlightCheckPay(
  tradeNo: string,
  options: { channel?: "tmc" | "tourist"; productType?: "Flight" | "Train" | "Hotel" } = {},
): Promise<boolean> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const round = attempt + 1;
    console.log(`${CHECK_PAY_LOG_PREFIX} attempt-start`, {
      tradeNo,
      round,
      maxAttempts: MAX_ATTEMPTS,
      channel: options.channel,
      productType: options.productType,
    });
    try {
      const ready = await getApi().book.checkPay({
        orderId: tradeNo,
        channel: options.channel,
        productType: options.productType,
      });
      console.log(`${CHECK_PAY_LOG_PREFIX} attempt-result`, {
        tradeNo,
        round,
        ready,
      });
      if (ready) return true;
    } catch {
      console.log(`${CHECK_PAY_LOG_PREFIX} attempt-error`, {
        tradeNo,
        round,
      });
      // Legacy keeps polling; fall through to next attempt.
    }
    await new Promise((resolve) => window.setTimeout(resolve, POLL_INTERVAL_MS));
  }
  console.log(`${CHECK_PAY_LOG_PREFIX} exhausted`, {
    tradeNo,
    maxAttempts: MAX_ATTEMPTS,
  });
  return false;
}

export function shouldNavigateToPay(input: {
  travelPayType: number | null | undefined;
  checkPayReady: boolean;
}): boolean {
  const { travelPayType, checkPayReady } = input;
  if (!checkPayReady) return false;
  return travelPayType === FLIGHT_PAY_TYPE_PERSON || travelPayType === FLIGHT_PAY_TYPE_CREDIT;
}
