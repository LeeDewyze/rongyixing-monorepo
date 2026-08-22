import { Suspense, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";

import "@ryx/ui/globals.css";

import { AppConfirmDialogHost } from "@/components/AppConfirmDialogHost";
import { DevMenu } from "@/components/DevMenu";
import { SessionGuardHost } from "@/components/SessionGuardHost";
import { bootstrapApi } from "@/lib/api";
import { preloadBusinessStaffPermission } from "@/lib/booking-permission-preload";
import { bootstrapExternalTicket } from "@/lib/external-ticket";
import { bootstrapWechatPayResultCallback } from "@/lib/pay-result-callback";
import { queryClient } from "@/lib/query";
import { setupVConsoleFromUrl } from "@/lib/vconsole";
import { setupViewportCompatibilityVars } from "@/lib/viewport-compat";
import { bootstrapWechatOAuthCallback } from "@/lib/wechat-oauth";

async function main() {
  setupViewportCompatibilityVars();
  await setupVConsoleFromUrl();
  bootstrapWechatOAuthCallback();
  await bootstrapApi();
  // Run in the background so a slow Pay-Process confirmation never blocks first paint.
  void bootstrapWechatPayResultCallback();
  await bootstrapExternalTicket();
  void preloadBusinessStaffPermission(queryClient, {
    preloadCredentials: false,
  });

  const { router } = await import("@/app/routes");

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <Suspense
          fallback={
            <div className="ryx-viewport-min flex items-center justify-center bg-[#F5F6F9] text-sm text-[#666666]">
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
