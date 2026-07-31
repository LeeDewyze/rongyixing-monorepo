import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import "@ryx/ui/globals.css";

import { router } from "@/app/routes";
import { AppConfirmDialogHost } from "@/components/AppConfirmDialogHost";
import { SessionGuardHost } from "@/components/SessionGuardHost";
import { bootstrapApi } from "@/lib/api";
import { preloadBusinessBookingPermission } from "@/lib/booking-permission-preload";
import { bootstrapExternalTicket } from "@/lib/external-ticket";
import { queryClient } from "@/lib/query";
import { setupVConsoleFromUrl } from "@/lib/vconsole";

async function main() {
  await setupVConsoleFromUrl();
  await bootstrapApi();
  await bootstrapExternalTicket("/");
  await preloadBusinessBookingPermission(queryClient);

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <AppConfirmDialogHost />
        <SessionGuardHost />
      </QueryClientProvider>
    </StrictMode>,
  );
}

void main();
