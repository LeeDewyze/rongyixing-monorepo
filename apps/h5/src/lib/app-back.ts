import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/** Back to home tab — used by top-level shortcuts from the home business panel. */
export function useHomeBack() {
  const navigate = useNavigate();
  return useCallback(() => {
    navigate("/home");
  }, [navigate]);
}

/** Browser back when possible; otherwise navigate to fallback. */
export function useSmartBack(fallback = "/home") {
  const navigate = useNavigate();
  return useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx;
    if (typeof idx === "number" && idx > 0) {
      navigate(-1);
      return;
    }
    navigate(fallback);
  }, [navigate, fallback]);
}
