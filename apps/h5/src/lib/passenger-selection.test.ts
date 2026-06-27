// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductType, type PassengerBookInfo } from "@ryx/shared-types";

import {
  loadPassengerSelection,
  passengerSelectionKey,
  removeCredentialFromPassengerSelections,
  savePassengerSelection,
  updatePassengerSelectionCredential,
} from "./passenger-selection";

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

const selectedPassenger: PassengerBookInfo = {
  id: "cred-1",
  passenger: {
    Id: "staff-1",
    AccountId: "account-1",
    Name: "张三",
    Credentials: [
      {
        Id: "cred-1",
        AccountId: "account-1",
        Name: "张三",
        CredentialsType: 1,
        Number: "110101199001011234",
      },
    ],
  },
  credential: {
    Id: "cred-1",
    AccountId: "account-1",
    Name: "张三",
    CredentialsType: 1,
    Number: "110101199001011234",
  },
};

describe("passenger-selection lifecycle", () => {
  beforeEach(() => {
    const storage = createMemoryStorage();
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("sessionStorage", createMemoryStorage());
    vi.stubGlobal("window", { dispatchEvent: vi.fn() });
    vi.stubGlobal(
      "CustomEvent",
      class {
        detail: unknown;

        constructor(
          public type: string,
          init?: { detail?: unknown },
        ) {
          this.detail = init?.detail;
        }
      },
    );
  });

  it("updates a selected credential after editing the same credential", () => {
    savePassengerSelection(ProductType.Hotel, [selectedPassenger]);

    updatePassengerSelectionCredential(ProductType.Hotel, "cred-1", {
      Name: "李四",
      Number: "220101199001011234",
      HideNumber: "220101********1234",
      CredentialsType: 1,
      CredentialsTypeName: "身份证",
    });

    const [updated] = loadPassengerSelection(ProductType.Hotel);
    expect(updated?.credential).toMatchObject({
      Id: "cred-1",
      Name: "李四",
      Number: "220101199001011234",
      HideNumber: "220101********1234",
    });
    expect(
      "Credentials" in updated!.passenger ? updated!.passenger.Credentials?.[0] : undefined,
    ).toMatchObject({
      Id: "cred-1",
      Name: "李四",
      Number: "220101199001011234",
    });
  });

  it("removes a selected credential after deleting the same credential", () => {
    savePassengerSelection(ProductType.Hotel, [selectedPassenger]);

    removeCredentialFromPassengerSelections(ProductType.Hotel, {
      Id: "cred-1",
      Name: "张三",
      CredentialsType: 1,
      Number: "changed-number",
    });

    expect(loadPassengerSelection(ProductType.Hotel)).toEqual([]);
    expect(localStorage.getItem(passengerSelectionKey(ProductType.Hotel))).toBe("[]");
  });

  it("updates selected credentials across product caches when product type is absent", () => {
    savePassengerSelection(ProductType.Flight, [selectedPassenger]);
    savePassengerSelection(ProductType.Hotel, [selectedPassenger]);
    savePassengerSelection(ProductType.Train, [selectedPassenger]);

    updatePassengerSelectionCredential(undefined, "cred-1", {
      Name: "王五",
      Number: "330101199001011234",
      HideNumber: "330101********1234",
      CredentialsType: 1,
      CredentialsTypeName: "身份证",
    });

    expect(loadPassengerSelection(ProductType.Flight)[0]?.credential.Name).toBe("王五");
    expect(loadPassengerSelection(ProductType.Hotel)[0]?.credential.Number).toBe(
      "330101199001011234",
    );
    expect(loadPassengerSelection(ProductType.Train)[0]?.credential.HideNumber).toBe(
      "330101********1234",
    );
  });
});
