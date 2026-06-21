const TICKET_KEY = "ticket";
const LOGIN_TOKEN_KEY = "loginToken";
const ACCESS_TOKEN_KEY = "accessToken";
const WEBSOCKET_URL_KEY = "websocketUrl";

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

export function clearSession(): void {
  localStorage.removeItem(TICKET_KEY);
  localStorage.removeItem(LOGIN_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(WEBSOCKET_URL_KEY);
}

export function saveLoginResult(result: {
  Ticket: string;
  Token?: string;
}): void {
  setTicket(result.Ticket);
  if (result.Token) {
    setLoginToken(result.Token);
    localStorage.setItem(ACCESS_TOKEN_KEY, result.Token);
  }
}
