import { describe, expect, it, vi } from "vitest";

import {
  confirmFlightListTimeoutDialog,
  getFlightListTimeoutDialogOpen,
  requestFlightListTimeoutDialog,
  resetFlightListTimeoutDialogForTests,
} from "./flight-list-timeout-dialog";

describe("flight-list-timeout-dialog", () => {
  it("opens only one dialog at a time", () => {
    resetFlightListTimeoutDialogForTests();

    const first = vi.fn();
    const second = vi.fn();

    requestFlightListTimeoutDialog(first);
    expect(getFlightListTimeoutDialogOpen()).toBe(true);

    requestFlightListTimeoutDialog(second);
    expect(getFlightListTimeoutDialogOpen()).toBe(true);

    confirmFlightListTimeoutDialog();
    expect(second).toHaveBeenCalledOnce();
    expect(first).not.toHaveBeenCalled();
    expect(getFlightListTimeoutDialogOpen()).toBe(false);
  });
});
