import type { IResponse } from "@ryx/shared-types";

let mockIdentityCheckForceLogout = false;

export function setMockIdentityCheckForceLogout(forceLogout: boolean): void {
  mockIdentityCheckForceLogout = forceLogout;
}

/** Legacy: Status true = session invalidated (kicked); false = still valid. */
export function mockIdentityCheckResponse(): IResponse<null> {
  if (mockIdentityCheckForceLogout) {
    return {
      Status: true,
      Code: "success",
      Message: "您的账号已在其他设备登录",
      Data: null,
    };
  }
  return {
    Status: false,
    Code: "",
    Message: "",
    Data: null,
  };
}
