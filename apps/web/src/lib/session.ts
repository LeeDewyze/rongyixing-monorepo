const TICKET_KEY = "ticket";
const LOGIN_TOKEN_KEY = "loginToken";
const ACCESS_TOKEN_KEY = "accessToken";
const WEBSOCKET_URL_KEY = "websocketUrl";
const LOGIN_USER_NAME_KEY = "loginUserName";
const LOGIN_USER_ID_KEY = "loginUserId";

export function getTicket(): string | null {
  return localStorage.getItem(TICKET_KEY);
}

export function setTicket(ticket: string): void {
  localStorage.setItem(TICKET_KEY, ticket);
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
}
