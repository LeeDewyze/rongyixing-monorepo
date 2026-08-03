/** Workbench item from `TmcApiHomeUrl-Workbench-Load`. */
export interface WorkbenchLink {
  url?: string;
  path?: string;
  tag?: string;
  isBlank?: boolean;
  isOpenInAppBrowser?: boolean;
}

export interface WorkbenchItem {
  Name?: string;
  ImageUrl?: string;
  Url?: WorkbenchLink | string;
  ImageBase64?: string;
}

export interface WorkbenchGroup {
  Name: string;
  Value: WorkbenchItem[];
}

export type WorkbenchLoadResponse = Record<string, WorkbenchItem[]>;

export function normalizeWorkbenchResponse(raw: unknown): WorkbenchGroup[] {
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw as Record<string, WorkbenchItem[]>).map(([name, value]) => ({
    Name: name,
    Value: Array.isArray(value) ? value : [],
  }));
}
