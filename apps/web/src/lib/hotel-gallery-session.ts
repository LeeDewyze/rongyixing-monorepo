const STORAGE_KEY = "ryx_hotel_gallery_images";

export function saveHotelGalleryImages(imageUrls: string[]): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(imageUrls));
}

export function loadHotelGalleryImages(): string[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((url): url is string => typeof url === "string" && url.trim().length > 0);
  } catch {
    return [];
  }
}

export function clearHotelGalleryImages(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
