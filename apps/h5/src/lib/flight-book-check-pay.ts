import { getApi } from "@/lib/api";

const POLL_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 5;

export async function pollFlightCheckPay(tradeNo: string): Promise<boolean> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const ready = await getApi().book.checkPay(tradeNo);
    if (ready) return true;
    await new Promise((resolve) => window.setTimeout(resolve, POLL_INTERVAL_MS));
  }
  return false;
}

export function shouldNavigateToPay(input: {
  travelPayType: number | null | undefined;
  checkPayReady: boolean;
}): boolean {
  const { travelPayType, checkPayReady } = input;
  if (!checkPayReady) return false;
  return travelPayType === 2;
}
