import { useEffect } from "react";

import { getApi } from "@/lib/api";
import {
  preloadBusinessIdentityPermission,
  stopBusinessIdentityPermissionRefresh,
} from "@/lib/booking-permission-preload";
import { getApiMode } from "@/lib/env";
import { queryClient } from "@/lib/query";
import { getTicket, SESSION_CHANGED_EVENT, setWebSocketUrl } from "@/lib/session";
import {
  checkSessionGuardNow,
  startSessionGuard,
} from "@/lib/session-guard";

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
          startSessionGuard();
          return;
        }
        startSessionGuard();
        void checkSessionGuardNow();
      })
      .catch((error) => {
        console.warn("[ryx] websocket url preload after render failed", error);
        startSessionGuard();
        void checkSessionGuardNow();
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
        bootstrapSessionData(currentTicket);
        void preloadBusinessIdentityPermission(queryClient).catch((error) => {
          console.warn("[ryx] identity permission preload after login failed", error);
        });
      }, 0);
    };

    window.addEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);

    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
    };
  }, []);

  return null;
}
