export type AppConfirmDialogVariant = "default" | "destructive";

export interface AppConfirmDialogOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  showCancelButton?: boolean;
  showCloseButton?: boolean;
  variant?: AppConfirmDialogVariant;
}

export interface AppConfirmDialogRequest extends Required<AppConfirmDialogOptions> {
  id: number;
  resolve: (confirmed: boolean) => void;
}

type DialogListener = (request: AppConfirmDialogRequest | null) => void;

let nextId = 1;
let current: AppConfirmDialogRequest | null = null;
const queue: AppConfirmDialogRequest[] = [];
const listeners = new Set<DialogListener>();

function normalizeOptions(options: AppConfirmDialogOptions): Required<AppConfirmDialogOptions> {
  return {
    title: options.title ?? "提示",
    message: options.message,
    confirmLabel: options.confirmLabel ?? "确定",
    cancelLabel: options.cancelLabel ?? "取消",
    showCancelButton: options.showCancelButton ?? true,
    showCloseButton: options.showCloseButton ?? true,
    variant: options.variant ?? "default",
  };
}

function notify(): void {
  for (const listener of listeners) {
    listener(current);
  }
}

function showNext(): void {
  if (current || queue.length === 0) return;
  current = queue.shift() ?? null;
  notify();
}

export function subscribeAppConfirmDialog(listener: DialogListener): () => void {
  listeners.add(listener);
  listener(current);
  return () => listeners.delete(listener);
}

export function getAppConfirmDialogSnapshot(): AppConfirmDialogRequest | null {
  return current;
}

export function resolveAppConfirmDialog(id: number, confirmed: boolean): void {
  if (!current || current.id !== id) return;
  const request = current;
  current = null;
  request.resolve(confirmed);
  notify();
  showNext();
}

export function showAppConfirmDialog(options: AppConfirmDialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    queue.push({
      id: nextId++,
      ...normalizeOptions(options),
      resolve,
    });
    showNext();
  });
}

export function showAppAlertDialog(
  messageOrOptions: string | AppConfirmDialogOptions,
): Promise<void> {
  const options =
    typeof messageOrOptions === "string" ? { message: messageOrOptions } : messageOrOptions;
  return showAppConfirmDialog({
    ...options,
    showCancelButton: false,
    showCloseButton: options.showCloseButton ?? false,
  }).then(() => undefined);
}
