import type { HomeProductId } from "@/config/home-assets";

export function parseHomeProduct(searchParams: URLSearchParams): HomeProductId {
  const product = searchParams.get("product");
  if (product === "flight" || product === "train" || product === "hotel") {
    return product;
  }
  return "hotel";
}

export function buildHomeProductSearch(product: HomeProductId): URLSearchParams {
  const params = new URLSearchParams();
  params.set("product", product);
  return params;
}
