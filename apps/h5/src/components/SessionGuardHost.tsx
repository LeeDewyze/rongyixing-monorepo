import { useEffect } from "react";

import { getTicket } from "@/lib/session";
import { onSessionGuardVisibility, startSessionGuard } from "@/lib/session-guard";

export function SessionGuardHost() {
  useEffect(() => {
    if (getTicket()) {
      startSessionGuard();
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
