const TICKET_KEY = "ticket";
const LOGIN_TOKEN_KEY = "loginToken";
const ACCESS_TOKEN_KEY = "accessToken";
const WEBSOCKET_URL_KEY = "websocketUrl";
const LOGIN_USER_NAME_KEY = "loginUserName";
const LOGIN_USER_ID_KEY = "loginUserId";
const TICKET_NAME_KEY = "ticketName";
const IDENTITY_PERMISSION_STORAGE_KEY = "ryx_identity_permission";
const TMC_ID_KEY = "ryx_tmcid";

export const SESSION_CHANGED_EVENT = "ryx:session-changed";

function getTicketNameFromContext(): string {
  const params = new URLSearchParams(globalThis.location?.search ?? "");
  const fromUrl = params.get(TICKET_NAME_KEY)?.trim();
  const fromStorage = localStorage.getItem(TICKET_NAME_KEY)?.trim();
  return fromUrl || fromStorage || TICKET_KEY;
}

function emitSessionChanged(): void {
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

export function getTicket(): string | null {
  const params = new URLSearchParams(globalThis.location?.search ?? "");
  const ticketName = getTicketNameFromContext();
  const fromUrl = params.get(ticketName)?.trim();
  if (fromUrl) return fromUrl;
  return localStorage.getItem(ticketName) || localStorage.getItem(TICKET_KEY);
}

export function setTicket(ticket: string): void {
  if (localStorage.getItem(TICKET_KEY) !== ticket) {
    sessionStorage.removeItem(IDENTITY_PERMISSION_STORAGE_KEY);
  }
  localStorage.setItem(TICKET_KEY, ticket);
}

export function setTicketName(ticketName: string): void {
  localStorage.setItem(TICKET_NAME_KEY, ticketName);
}

/** Externally passed `?tmcid=` — the DingTalk bind flow's required TmcId source. */
export function getTmcId(): string | null {
  return localStorage.getItem(TMC_ID_KEY)?.trim() || null;
}

export function setTmcId(tmcId: string): void {
  const normalized = `${tmcId ?? ""}`.trim();
  if (normalized) {
    localStorage.setItem(TMC_ID_KEY, normalized);
  }
}

export function getLoginToken(): string | null {
  return localStorage.getItem(LOGIN_TOKEN_KEY);
}

export function setLoginToken(token: string): void {
  localStorage.setItem(LOGIN_TOKEN_KEY, token);
}

export function getWebSocketUrl(): string | null {
  return localStorage.getItem(WEBSOCKET_URL_KEY);
}

export function setWebSocketUrl(url: string): void {
  localStorage.setItem(WEBSOCKET_URL_KEY, url);
}

/** Display name from LoginByRyx / MobileLogin response. */
export function getLoginUserName(): string | null {
  return localStorage.getItem(LOGIN_USER_NAME_KEY);
}

/** User id from login response (legacy Member-Get Id fallback). */
export function getLoginUserId(): string | null {
  return localStorage.getItem(LOGIN_USER_ID_KEY);
}

export function clearSession(): void {
  localStorage.removeItem(TICKET_KEY);
  localStorage.removeItem(LOGIN_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(WEBSOCKET_URL_KEY);
  localStorage.removeItem(LOGIN_USER_NAME_KEY);
  localStorage.removeItem(LOGIN_USER_ID_KEY);
  localStorage.removeItem(TICKET_NAME_KEY);
  sessionStorage.removeItem(IDENTITY_PERMISSION_STORAGE_KEY);
  emitSessionChanged();
}

export function saveLoginResult(result: {
  Ticket: string;
  Token?: string;
  Name?: string;
  Id?: string;
}): void {
  setTicket(result.Ticket);
  if (result.Name) {
    localStorage.setItem(LOGIN_USER_NAME_KEY, result.Name);
  }
  if (result.Id) {
    localStorage.setItem(LOGIN_USER_ID_KEY, result.Id);
  }
  if (result.Token) {
    setLoginToken(result.Token);
    localStorage.setItem(ACCESS_TOKEN_KEY, result.Token);
  }
  emitSessionChanged();
}
