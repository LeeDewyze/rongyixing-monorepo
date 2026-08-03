type Listener = () => void;

let open = false;
let onConfirm: (() => void) | null = null;
const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeFlightListTimeoutDialog(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getFlightListTimeoutDialogOpen(): boolean {
  return open;
}

/** Open the timeout dialog once; no-op if it is already visible. */
export function requestFlightListTimeoutDialog(confirmHandler: () => void): void {
  onConfirm = confirmHandler;
  if (open) return;
  open = true;
  notify();
}

export function confirmFlightListTimeoutDialog(): void {
  if (!open) return;
  const handler = onConfirm;
  onConfirm = null;
  handler?.();
  open = false;
  notify();
}

/** Test-only reset. */
export function resetFlightListTimeoutDialogForTests(): void {
  open = false;
  onConfirm = null;
  notify();
}
