import { afterEach, describe, expect, it, vi } from "vitest";

import { getTicket } from "./session";

describe("getTicket", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefers the ticket in the current URL over a stored ticket", () => {
    vi.stubGlobal("location", { search: "?ticket=url-ticket" });
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => (key === "ticket" ? "stored-ticket" : null),
    });

    expect(getTicket()).toBe("url-ticket");
  });

  it("uses the current URL ticket name", () => {
    vi.stubGlobal("location", { search: "?ticketName=auth&auth=url-ticket" });
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => (key === "ticket" ? "stored-ticket" : null),
    });

    expect(getTicket()).toBe("url-ticket");
  });
});
