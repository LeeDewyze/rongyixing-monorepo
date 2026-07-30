import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  stopSessionGuard: vi.fn(),
  resetApi: vi.fn(),
  clearSession: vi.fn(),
  queryClear: vi.fn(),
  showAppAlertDialog: vi.fn(async () => undefined),
  ticket: { value: null as string | null },
}));

vi.mock("@/lib/session-guard", () => ({ stopSessionGuard: mocks.stopSessionGuard }));
vi.mock("@/lib/api", () => ({ resetApi: mocks.resetApi }));
vi.mock("@/lib/session", () => ({
  clearSession: mocks.clearSession,
  getTicket: () => mocks.ticket.value,
}));
vi.mock("@/lib/query", () => ({ queryClient: { clear: mocks.queryClear } }));
vi.mock("@/lib/app-confirm-dialog", () => ({ showAppAlertDialog: mocks.showAppAlertDialog }));
vi.mock("@/lib/base-path", () => ({
  stripAppBasePath: (path: string) => path,
  withAppBasePath: (path: string) => path,
}));

function stubBrowser(pathname: string) {
  const store = new Map<string, string>();
  const replace = vi.fn();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  });
  vi.stubGlobal("window", { location: { pathname, search: "", replace } });
  return { replace, store };
}

async function loadForceLogout() {
  vi.resetModules();
  return import("./force-logout");
}

describe("performForceLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    mocks.ticket.value = "ticket-1";
  });

  it("alerts, clears the session and redirects only once for concurrent triggers", async () => {
    const { replace, store } = stubBrowser("/home");
    const { performForceLogout } = await loadForceLogout();

    await Promise.all([
      performForceLogout({ message: "您的账号已在其他设备登录", preventAutoLogin: true }),
      performForceLogout({ message: "登录已失效", preventAutoLogin: true }),
    ]);

    expect(mocks.showAppAlertDialog).toHaveBeenCalledTimes(1);
    expect(mocks.showAppAlertDialog).toHaveBeenCalledWith("您的账号已在其他设备登录");
    expect(mocks.stopSessionGuard).toHaveBeenCalled();
    expect(mocks.clearSession).toHaveBeenCalledTimes(1);
    expect(mocks.queryClear).toHaveBeenCalledTimes(1);
    expect(mocks.resetApi).toHaveBeenCalledTimes(1);
    expect(store.get("ryx_prevent_auto_login")).toBe("1");
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/login/password?preventAutoLogin=1&returnTo=%2Fhome");
  });

  it("stays armed after a trigger that arrives without a session", async () => {
    const { replace } = stubBrowser("/home");
    const { performForceLogout } = await loadForceLogout();

    mocks.ticket.value = null;
    await performForceLogout({ message: "登录已失效" });
    expect(mocks.showAppAlertDialog).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();

    mocks.ticket.value = "ticket-2";
    await performForceLogout({ message: "您的账号已在其他设备登录" });
    expect(mocks.showAppAlertDialog).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("clears the session without alert or redirect while already on the login page", async () => {
    const { replace } = stubBrowser("/login/password");
    const { performForceLogout } = await loadForceLogout();

    await performForceLogout({ message: "登录已失效" });
    expect(mocks.showAppAlertDialog).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(mocks.clearSession).toHaveBeenCalledTimes(1);

    await performForceLogout({ message: "登录已失效" });
    expect(mocks.clearSession).toHaveBeenCalledTimes(2);
  });
});
