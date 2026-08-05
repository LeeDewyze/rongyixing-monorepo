import { describe, expect, it, vi } from "vitest";

import { createGatewayClient } from "./gateway.js";

describe("createGatewayClient", () => {
  it("posts login mobile code with legacy RequestEntity form body", async () => {
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/Home/Setting?appId=com.ronglvonline.app") {
        return new Response(
          JSON.stringify({
            Status: true,
            Data: {
              Token: "token-1",
              Domain: "rongtrip.cn",
              Urls: {},
            },
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new Response(JSON.stringify({ Status: true, Data: { SendInterval: 60 } }), {
        headers: { "Content-Type": "application/json" },
      });
    });

    const client = createGatewayClient({
      baseUrl: "",
      appId: "com.ronglvonline.app",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      getTicket: () => "",
      getTicketName: () => "ticket",
      getDomain: () => "rongtrip.cn",
      getLanguage: () => "cn",
      getExtraFields: () => ({ root: "www" }),
    });

    await expect(client.sendLoginMobileCode({ Mobile: "18610773065" })).resolves.toBe(true);

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl).toHaveBeenLastCalledWith(
      "/Home/SendLoginMobileCode",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }),
    );

    const body = String(fetchImpl.mock.calls[1]?.[1]?.body);
    expect(body).toContain("Data=%7B%22Mobile%22%3A%2218610773065%22%7D");
    expect(body).toContain("Token=token-1");
    expect(body).toContain("Sign=");
    expect(body).toContain("x-requested-with=XMLHttpRequest");
    expect(body).toContain("Domain=rongtrip.cn");
    expect(body).toContain("root=www");
    expect(body).not.toContain("Method=");
  });
});
