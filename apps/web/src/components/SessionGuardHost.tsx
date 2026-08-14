import { useEffect } from "react";

import { getApi } from "@/lib/api";
import {
  preloadBusinessIdentityPermission,
  stopBusinessIdentityPermissionRefresh,
} from "@/lib/booking-permission-preload";
import { getApiMode } from "@/lib/env";
import { queryClient } from "@/lib/query";
import { getTicket, SESSION_CHANGED_EVENT, setWebSocketUrl } from "@/lib/session";
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

    const handleSessionChanged = () => {
      if (!getTicket()) {
        bootstrappedTicket = null;
        stopBusinessIdentityPermissionRefresh();
        return;
      }
      window.setTimeout(() => {
        const currentTicket = getTicket();
        if (!currentTicket) {
          bootstrappedTicket = null;
          stopBusinessIdentityPermissionRefresh();
          return;
        }
        void preloadBusinessIdentityPermission(queryClient).catch((error) => {
          console.warn("[ryx] identity permission preload after login failed", error);
        });
      }, 0);
    };

    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    window.addEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
    };
  }, []);

  return null;
}
