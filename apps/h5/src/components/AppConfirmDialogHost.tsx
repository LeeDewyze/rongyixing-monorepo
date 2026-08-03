import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  getAppConfirmDialogSnapshot,
  resolveAppConfirmDialog,
  subscribeAppConfirmDialog,
} from "@/lib/app-confirm-dialog";

export function AppConfirmDialogHost() {
  const [request, setRequest] = useState(getAppConfirmDialogSnapshot);

  useEffect(() => subscribeAppConfirmDialog(setRequest), []);

  if (!request) return null;

  return (
    <ConfirmDialog
      open
      title={request.title}
      message={request.message}
      confirmLabel={request.confirmLabel}
      cancelLabel={request.cancelLabel}
      showCancelButton={request.showCancelButton}
      showCloseButton={request.showCloseButton}
      variant={request.variant}
      onConfirm={() => resolveAppConfirmDialog(request.id, true)}
      onCancel={() => resolveAppConfirmDialog(request.id, false)}
    />
  );
}
