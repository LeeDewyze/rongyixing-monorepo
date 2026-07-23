// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import type { NavigateFunction } from "react-router-dom";

import { canNavigateBack, navigateReturn } from "./navigation";

type HistoryStub = {
  state: { idx?: number } | null;
  length: number;
  replaceState: (state: { idx?: number } | null) => void;
};

function installHistoryStub(state: { idx?: number } | null, length: number): HistoryStub {
  const stub: HistoryStub = {
    state,
    length,
    replaceState(nextState) {
      stub.state = nextState;
    },
  };

  vi.stubGlobal("window", {
    history: stub,
  });

  return stub;
}

describe("navigation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("canNavigateBack", () => {
    it("returns false when history index is 0", () => {
      installHistoryStub({ idx: 0 }, 2);
      expect(canNavigateBack()).toBe(false);
    });

    it("returns true when history index is greater than 0", () => {
      installHistoryStub({ idx: 2 }, 3);
      expect(canNavigateBack()).toBe(true);
    });
  });

  describe("navigateReturn", () => {
    it("pops history when a prior entry exists", () => {
      const navigate = vi.fn() as unknown as NavigateFunction;
      installHistoryStub({ idx: 2 }, 3);

      navigateReturn(navigate, "/flight/list?date=2026-07-23");

      expect(navigate).toHaveBeenCalledWith(-1);
    });

    it("replaces with returnTo when history cannot go back", () => {
      const navigate = vi.fn() as unknown as NavigateFunction;
      installHistoryStub({ idx: 0 }, 1);

      navigateReturn(navigate, "/flight/list?date=2026-07-23");

      expect(navigate).toHaveBeenCalledWith("/flight/list?date=2026-07-23", { replace: true });
    });
  });
});
