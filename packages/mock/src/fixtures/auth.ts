import type { LoginResultDto } from "@ryx/shared-types";
import { successResponse } from "@ryx/api";

export const MOCK_IDENTITY = {
  Ticket: "mock-ticket-001",
  Id: "10001",
  Name: "测试用户",
  Token: "mock-login-token",
  IsShareTicket: false,
};

export const MOCK_LOGIN_RESULT: LoginResultDto = {
  Ticket: MOCK_IDENTITY.Ticket,
  Id: MOCK_IDENTITY.Id,
  Name: MOCK_IDENTITY.Name,
  Token: MOCK_IDENTITY.Token,
};

export function mockLoginSuccess() {
  return successResponse(MOCK_LOGIN_RESULT);
}

export function mockIdentityGet() {
  return successResponse(MOCK_IDENTITY);
}
