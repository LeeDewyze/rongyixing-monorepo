import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import "@ryx/ui/globals.css";

import { router } from "@/app/routes";
import { AppConfirmDialogHost } from "@/components/AppConfirmDialogHost";
import { bootstrapApi } from "@/lib/api";
import { bootstrapExternalTicket } from "@/lib/external-ticket";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

async function main() {
  await bootstrapApi();
  await bootstrapExternalTicket("/");

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <AppConfirmDialogHost />
      </QueryClientProvider>
    </StrictMode>,
  );
}

void main();
