import { Suspense, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";

import "@ryx/ui/globals.css";

import { router } from "@/app/routes";
import { AppConfirmDialogHost } from "@/components/AppConfirmDialogHost";
import { DevMenu } from "@/components/DevMenu";
import { SessionGuardHost } from "@/components/SessionGuardHost";
import { bootstrapApi } from "@/lib/api";
import { preloadBusinessBookingPermission } from "@/lib/booking-permission-preload";
import { bootstrapExternalTicket } from "@/lib/external-ticket";
import { queryClient } from "@/lib/query";
import { setupVConsoleFromUrl } from "@/lib/vconsole";

async function main() {
  await setupVConsoleFromUrl();
  await bootstrapApi();
  await bootstrapExternalTicket("/home");
  await preloadBusinessBookingPermission(queryClient, { silentUnauthorized: true });

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <Suspense
          fallback={
            <div className="flex min-h-dvh items-center justify-center bg-[#F5F6F9] text-sm text-[#666666]">
              加载中…
            </div>
          }
        >
          <RouterProvider router={router} />
        </Suspense>
        <AppConfirmDialogHost />
        <SessionGuardHost />
        <DevMenu />
      </QueryClientProvider>
    </StrictMode>,
  );
}

void main();
