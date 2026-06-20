import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";

import "@ryx/ui/globals.css";

import { router } from "@/app/routes";
import { DevMenu } from "@/components/DevMenu";
import { bootstrapApi } from "@/lib/api";
import { queryClient } from "@/lib/query";

async function main() {
  await bootstrapApi();

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <DevMenu />
      </QueryClientProvider>
    </StrictMode>,
  );
}

void main();
