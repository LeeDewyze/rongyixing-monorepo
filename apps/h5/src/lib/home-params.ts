import type { HomeProductId } from "@/config/home-assets";

export function parseHomeProduct(searchParams: URLSearchParams): HomeProductId {
  const product = searchParams.get("product");
  if (product === "train" || product === "hotel") {
    return product;
  }
  return "hotel";
}

export function buildHomeProductSearch(product: HomeProductId): URLSearchParams {
  const params = new URLSearchParams();
  if (product === "train" || product === "hotel") {
    params.set("product", product);
  }
  return params;
}
