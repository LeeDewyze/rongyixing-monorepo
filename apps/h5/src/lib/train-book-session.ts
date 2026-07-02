import type {
  TrainBookPolicy,
  TrainItem,
  TrainSearchParams,
  TrainSeat,
} from "@ryx/shared-types";
import type { PassengerBookInfo } from "@ryx/shared-types";
import type { HomeTravelMode } from "@/config/home-assets";

const STORAGE_KEY = "ryx_train_book_selection";
export const TRAIN_BOOK_SELECTION_EVENT = "ryx-train-book-selection-change";

export interface TrainBookSelection {
  searchParams: TrainSearchParams;
  train: TrainItem;
  seat: TrainSeat;
  /** Home-Search raw train entity for Initialize/Book — falls back to train.searchSnapshot. */
  trainSnapshot?: Record<string, unknown>;
  policy?: TrainBookPolicy;
  passengers: PassengerBookInfo[];
  selectedAt: number;
  travelMode?: HomeTravelMode;
}

function notifyChange(): void {
  window.dispatchEvent(new CustomEvent(TRAIN_BOOK_SELECTION_EVENT));
}

export function loadTrainBookSelection(): TrainBookSelection | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TrainBookSelection;
    if (!parsed?.train || !parsed?.seat || !parsed?.searchParams) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveTrainBookSelection(selection: TrainBookSelection): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
  notifyChange();
}

export function clearTrainBookSelection(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  notifyChange();
}
