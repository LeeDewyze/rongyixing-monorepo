import { describe, expect, it, vi } from "vitest";

import { createApiClient } from "./client.js";
import { ApiError } from "./errors.js";

describe("createApiClient", () => {
  it("sends JSON requests to the configured base URL", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ success: true, data: { id: "1" } }),
    );

    const client = createApiClient({
      baseUrl: "https://api.example.com",
      fetchImpl,
    });

    const result = await client.get<{ id: string }>("/users/1");

    expect(result).toEqual({ id: "1" });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.example.com/users/1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("attaches bearer token when provided", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ success: true, data: { ok: true } }),
    );

    const client = createApiClient({
      baseUrl: "https://api.example.com",
      getAccessToken: () => "token-123",
      fetchImpl,
    });

    await client.get("/secure");

    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer token-123");
  });

  it("throws ApiError for non-2xx responses", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ message: "Unauthorized" }, { status: 401 }),
    );

    const client = createApiClient({
      baseUrl: "https://api.example.com",
      fetchImpl,
    });

    await expect(client.get("/secure")).rejects.toBeInstanceOf(ApiError);
  });
});
