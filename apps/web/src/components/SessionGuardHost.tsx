import { useEffect } from "react";

import { getApi } from "@/lib/api";
import { preloadBusinessIdentityPermission } from "@/lib/booking-permission-preload";
import { getApiMode } from "@/lib/env";
import { queryClient } from "@/lib/query";
import { getTicket } from "@/lib/session";
import { setWebSocketUrl } from "@/lib/session";
import { onSessionGuardVisibility, startSessionGuard } from "@/lib/session-guard";

let bootstrappedTicket: string | null = null;

function bootstrapSessionData(ticket: string): void {
  if (bootstrappedTicket === ticket) return;
  bootstrappedTicket = ticket;

  void preloadBusinessIdentityPermission(queryClient).catch((error) => {
    console.warn("[ryx] identity permission preload after render failed", error);
  });

  if (getApiMode() !== "mock") {
    void getApi()
      .identity.getWebSocketUrl()
      .then((ws) => {
        if (ws?.Url) {
          setWebSocketUrl(ws.Url);
        }
        startSessionGuard();
      })
      .catch((error) => {
        console.warn("[ryx] websocket url preload after render failed", error);
        startSessionGuard();
      });
    return;
  }

  startSessionGuard();
}

export function SessionGuardHost() {
  useEffect(() => {
    const ticket = getTicket();
    if (ticket) {
      bootstrapSessionData(ticket);
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void onSessionGuardVisibility();
      }
    };

    const handleFocus = () => {
      void onSessionGuardVisibility();
    };

    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return null;
}
