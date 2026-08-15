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
    const payload = JSON.parse(data) as { Type?: string };
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
    const nextSocket = new WebSocket(url);
    socket = nextSocket;
    lastMessageAt = Date.now();

    nextSocket.onopen = () => {
      if (!isRunning || socket !== nextSocket) return;
      startHeartbeat();
      startIdleWatch();
    };

    nextSocket.onmessage = (event) => {
      if (socket !== nextSocket) return;
      handleWebSocketMessage(event.data);
    };

    nextSocket.onerror = () => {
      // Silent fallback to polling.
    };

    nextSocket.onclose = () => {
      if (socket !== nextSocket) return;
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
  try {
    const result = await getApi().identity.check();
    if (!isRunning || isForceLogoutInProgress()) return;

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

/** Connect the websocket after an asynchronous GetWebSocketUrl response is stored. */
export function refreshSessionGuardWebSocket(): void {
  if (!isRunning || getApiMode() === "mock" || !getTicket()) return;
  connectWebSocket();
}

/** Stop polling and websocket guard. */
export function stopSessionGuard(): void {
  isRunning = false;
  identityCheckInFlight = false;
  clearPoll();
  disconnectWebSocket();
}

/** Run an immediate identity check when the app returns to the foreground. */
export async function onSessionGuardVisibility(): Promise<void> {
  if (!isRunning || getApiMode() === "mock") return;
  if (!getTicket()) {
    stopSessionGuard();
    return;
  }
  await runIdentityCheck();
}
