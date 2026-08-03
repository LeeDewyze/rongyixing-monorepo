import type { ProductChannel, OrderListScope } from "@ryx/shared-types";

export function parseProductChannel(searchParams: URLSearchParams): ProductChannel | undefined {
  const raw = searchParams.get("channel");
  if (raw === "tourist" || raw === "tmc") {
    return raw;
  }
  return undefined;
}

export function withOrderChannel(
  path: string,
  channel: ProductChannel | undefined,
  extra?: { scope?: OrderListScope },
): string {
  const [base = path, search = ""] = path.split("?");
  const params = new URLSearchParams(search);
  if (channel) {
    params.set("channel", channel);
  }
  if (extra?.scope) {
    params.set("scope", extra.scope);
  }
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function buildOrderPayPath(
  product: "flight" | "train" | "hotel",
  orderId: string,
  channel?: ProductChannel,
  scope?: OrderListScope,
): string {
  return withOrderChannel(`/orders/${product}/${encodeURIComponent(orderId)}/pay`, channel, {
    scope,
  });
}
