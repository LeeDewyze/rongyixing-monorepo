import { getApi } from "@/lib/api";
import { isForceLogoutInProgress, performForceLogout } from "@/lib/force-logout";
import { getApiMode } from "@/lib/env";
import { getTicket, getWebSocketUrl } from "@/lib/session";

const IDENTITY_CHECK_INTERVAL_MS = 120_000;
const WS_HEARTBEAT_MS = 30_000;
const WS_IDLE_MS = 60_000;
const WS_IDLE_TICK_MS = 10_000;

let isRunning = false;
let pollTimeoutId: ReturnType<typeof setTimeout> | null = null;
let socket: WebSocket | null = null;
let heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
let idleIntervalId: ReturnType<typeof setInterval> | null = null;
let lastMessageAt = 0;
let identityCheckInFlight = false;

function maskSecret(value: string | null | undefined): string {
  if (!value) return "<empty>";
  if (value.length <= 8) return `${value.slice(0, 2)}***`;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function describeWebSocketUrl(rawUrl: string | null): string {
  if (!rawUrl) return "<empty>";
  try {
    const url = new URL(rawUrl, window.location.href);
    return `${url.protocol}//${url.host}${url.pathname}${url.search ? "?[redacted]" : ""}`;
  } catch {
    return "<invalid-url>";
  }
}

function clearPoll(): void {
  if (pollTimeoutId !== null) {
    clearTimeout(pollTimeoutId);
    pollTimeoutId = null;
  }
}

function schedulePoll(delayMs: number): void {
  if (!isRunning || isForceLogoutInProgress()) return;
  clearPoll();
  pollTimeoutId = setTimeout(() => {
    pollTimeoutId = null;
    void runIdentityCheck();
  }, delayMs);
}

function normalizeWebSocketUrl(url: string): string {
  let normalized = url.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:");
  if (window.location.protocol === "https:" && normalized.startsWith("ws://")) {
    normalized = `wss://${normalized.slice("ws://".length)}`;
  }
  return normalized;
}

function clearHeartbeat(): void {
  if (heartbeatIntervalId !== null) {
    clearInterval(heartbeatIntervalId);
    heartbeatIntervalId = null;
  }
}

function clearIdleWatch(): void {
  if (idleIntervalId !== null) {
    clearInterval(idleIntervalId);
    idleIntervalId = null;
  }
}

function disconnectWebSocket(): void {
  clearHeartbeat();
  clearIdleWatch();
  if (socket) {
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
    socket = null;
  }
}

function startHeartbeat(): void {
  clearHeartbeat();
  heartbeatIntervalId = setInterval(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send("");
    }
  }, WS_HEARTBEAT_MS);
}

function startIdleWatch(): void {
  clearIdleWatch();
  idleIntervalId = setInterval(() => {
    if (!isRunning || isForceLogoutInProgress()) return;
    if (Date.now() - lastMessageAt >= WS_IDLE_MS) {
      lastMessageAt = Date.now();
      void runIdentityCheck();
    }
  }, WS_IDLE_TICK_MS);
}

function handleWebSocketMessage(data: string | ArrayBuffer | Blob): void {
  lastMessageAt = Date.now();
  if (typeof data !== "string" || !data.trim()) return;

  try {
    const payload = JSON.parse(data) as { Type?: string } & Record<string, unknown>;
    console.info("[ryx] session guard: websocket message", {
      ticket: maskSecret(getTicket()),
      payload,
    });
    if (payload.Type === "CheckForceLogout") {
      console.warn("[ryx] session guard: received CheckForceLogout websocket event");
      void runIdentityCheck();
    }
  } catch {
    // Ignore non-JSON payloads.
  }
}

function connectWebSocket(): void {
  const rawUrl = getWebSocketUrl();
  if (!rawUrl || !isRunning) return;

  disconnectWebSocket();

  try {
    const url = normalizeWebSocketUrl(rawUrl);
    console.info("[ryx] session guard: websocket connecting", {
      ticket: maskSecret(getTicket()),
      url: describeWebSocketUrl(url),
    });
    const nextSocket = new WebSocket(url);
    socket = nextSocket;
    lastMessageAt = Date.now();

    nextSocket.onopen = () => {
      if (!isRunning || socket !== nextSocket) return;
      console.info("[ryx] session guard: websocket opened", {
        ticket: maskSecret(getTicket()),
        readyState: nextSocket.readyState,
      });
      startHeartbeat();
      startIdleWatch();
    };

    nextSocket.onmessage = (event) => {
      if (socket !== nextSocket) return;
      handleWebSocketMessage(event.data);
    };

    nextSocket.onerror = (event) => {
      console.warn("[ryx] session guard: websocket error; polling remains enabled", {
        ticket: maskSecret(getTicket()),
        url: describeWebSocketUrl(url),
        event,
      });
    };

    nextSocket.onclose = (event) => {
      if (socket !== nextSocket) return;
      console.warn("[ryx] session guard: websocket closed", {
        ticket: maskSecret(getTicket()),
        code: event.code,
        reason: event.reason || "<empty>",
        wasClean: event.wasClean,
      });
      clearHeartbeat();
      clearIdleWatch();
      socket = null;
    };
  } catch (error) {
    console.warn("[ryx] session guard: websocket connect failed", error);
  }
}

async function runIdentityCheck(): Promise<void> {
  if (!isRunning || isForceLogoutInProgress() || identityCheckInFlight) return;
  if (!getTicket()) {
    stopSessionGuard();
    return;
  }

  identityCheckInFlight = true;
  const ticket = getTicket();
  console.info("[ryx] session guard: Identity/Check started", {
    ticket: maskSecret(ticket),
  });
  try {
    const result = await getApi().identity.check();
    if (!isRunning || isForceLogoutInProgress()) return;

    console.info("[ryx] session guard: Identity/Check result", {
      ticket: maskSecret(ticket),
      forceLogout: result.forceLogout,
      message: result.message || "<empty>",
    });

    if (result.forceLogout) {
      console.warn("[ryx] session guard: Identity/Check confirmed forced logout");
      await performForceLogout({
        message: result.message,
        preventAutoLogin: true,
      });
      return;
    }

    schedulePoll(IDENTITY_CHECK_INTERVAL_MS);
  } catch (error) {
    console.warn("[ryx] session guard: identity check failed", error);
    schedulePoll(IDENTITY_CHECK_INTERVAL_MS);
  } finally {
    identityCheckInFlight = false;
  }
}

/** Start identity polling and optional websocket guard when a ticket exists. */
export function startSessionGuard(): void {
  if (getApiMode() === "mock") return;
  if (!getTicket()) return;
  if (isRunning) return;

  isRunning = true;
  schedulePoll(IDENTITY_CHECK_INTERVAL_MS);
  connectWebSocket();
}

/** Stop polling and websocket guard. */
export function stopSessionGuard(): void {
  isRunning = false;
  identityCheckInFlight = false;
  clearPoll();
  disconnectWebSocket();
}

/** Run the legacy fallback check when websocket initialization fails. */
export async function checkSessionGuardNow(): Promise<void> {
  if (!isRunning || getApiMode() === "mock") return;
  if (!getTicket()) {
    stopSessionGuard();
    return;
  }
  await runIdentityCheck();
}
