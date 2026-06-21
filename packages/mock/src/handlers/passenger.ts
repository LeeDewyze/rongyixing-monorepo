import type { IResponse } from "@ryx/shared-types";
import { CredentialType, CREDENTIAL_TYPE_LABELS } from "@ryx/shared-types";
import { PASSENGER_FLOW_METHODS, TMC_METHODS, successResponse } from "@ryx/api";

import { filterMockStaff, MOCK_STAFF } from "../fixtures/passenger.js";
import { mockPassengers } from "../fixtures/passenger-store.js";

const MOCK_TMC = {
  AllowAddingNonTmcUser: true,
  Id: "TMC001",
  Name: "测试企业",
};

function hideNumber(num: string): string {
  if (num.length <= 7) return num;
  return `${num.slice(0, 3)}****${num.slice(-4)}`;
}

export function createPassengerMockHandlers(): Record<
  string,
  (data: unknown) => IResponse<unknown>
> {
  return {
    [PASSENGER_FLOW_METHODS.STAFF_LIST]: (data) => {
      const params = data as {
        Name?: string;
        Mobile?: string;
        PageIndex?: number;
        PageSize?: number;
      };
      const keyword = params.Name ?? params.Mobile ?? "";
      const pageIndex = params.PageIndex ?? 0;
      const pageSize = params.PageSize ?? 20;
      return successResponse(filterMockStaff(keyword, pageIndex, pageSize));
    },
    [PASSENGER_FLOW_METHODS.PASSENGER_LIST]: (data) => {
      const params = data as { Name?: string; Mobile?: string; PageIndex?: number; PageSize?: number };
      const keyword = (params.Name ?? params.Mobile ?? "").trim().toLowerCase();
      let passengers = mockPassengers;
      if (keyword) {
        passengers = passengers.filter(
          (p) => p.Name.toLowerCase().includes(keyword) || (p.Mobile ?? "").includes(keyword),
        );
      }
      const pageIndex = params.PageIndex ?? 0;
      const pageSize = params.PageSize ?? 20;
      const start = pageIndex * pageSize;
      const slice = passengers.slice(start, start + pageSize);
      return successResponse({
        Passengers: slice,
        TotalCount: passengers.length,
      });
    },
    [PASSENGER_FLOW_METHODS.PASSENGER_ADD]: (data) => {
      const body = data as Record<string, unknown>;
      const type = Number(body.Type ?? body.CredentialsType ?? CredentialType.IdCard);
      const number = String(body.Number ?? "");
      const entry = {
        Id: `P${Date.now()}`,
        Name: String(body.Name ?? ""),
        Mobile: String(body.Mobile ?? ""),
        CredentialsType: type,
        CredentialsTypeName: CREDENTIAL_TYPE_LABELS[type] ?? "身份证",
        Number: number,
        HideCredentialsNumber: hideNumber(number),
        CredentialNo: number,
        CredentialType: type,
        CredentialTypeName: CREDENTIAL_TYPE_LABELS[type] ?? "身份证",
        IsSelf: false,
        Country: body.Country,
        IssueCountry: body.IssueCountry,
        Gender: body.Gender,
      };
      mockPassengers.unshift(entry);
      return successResponse(entry.Id);
    },
    [PASSENGER_FLOW_METHODS.PASSENGER_MODIFY]: (data) => {
      const body = data as Record<string, unknown>;
      const id = String(body.Id ?? "");
      const idx = mockPassengers.findIndex((p) => p.Id === id);
      if (idx >= 0) {
        const type = Number(body.Type ?? body.CredentialsType ?? mockPassengers[idx].CredentialsType);
        const number = String(body.Number ?? mockPassengers[idx].Number ?? "");
        mockPassengers[idx] = {
          ...mockPassengers[idx],
          Name: String(body.Name ?? mockPassengers[idx].Name),
          Mobile: String(body.Mobile ?? mockPassengers[idx].Mobile ?? ""),
          CredentialsType: type,
          CredentialsTypeName: CREDENTIAL_TYPE_LABELS[type] ?? mockPassengers[idx].CredentialsTypeName,
          Number: number,
          HideCredentialsNumber: hideNumber(number),
          CredentialNo: number,
          CredentialType: type,
          Gender: body.Gender ?? mockPassengers[idx].Gender,
        };
        return successResponse(mockPassengers[idx]);
      }
      return successResponse(body);
    },
    [PASSENGER_FLOW_METHODS.PASSENGER_REMOVE]: (data) => {
      const id = String((data as { Id?: string }).Id ?? "");
      mockPassengers.splice(0, mockPassengers.length, ...mockPassengers.filter((p) => p.Id !== id));
      return successResponse(true);
    },
    [TMC_METHODS.STAFF_CREDENTIALS]: (data) => {
      const params = data as { AccountId?: string };
      const staff = MOCK_STAFF.find((s) => s.AccountId === params.AccountId || s.Id === params.AccountId);
      return successResponse(staff?.Credentials ?? []);
    },
    [TMC_METHODS.CREDENTIALS_ADD]: (data) => {
      const body = data as Record<string, unknown>;
      const staffId = String(body.StaffId ?? "");
      const staff = MOCK_STAFF.find((s) => s.Id === staffId || s.AccountId === staffId);
      const id = `C${Date.now()}`;
      const cred = {
        Id: id,
        AccountId: staff?.AccountId ?? staffId,
        Name: String(body.Name ?? staff?.Name ?? ""),
        Mobile: String(body.Mobile ?? staff?.Mobile ?? ""),
        Type: Number(body.Type ?? CredentialType.Passport),
        CredentialsType: Number(body.Type ?? CredentialType.Passport),
        CredentialsTypeName: String(body.CredentialsTypeName ?? "护照"),
        TypeName: String(body.CredentialsTypeName ?? "护照"),
        Number: String(body.Number ?? ""),
        HideNumber: hideNumber(String(body.Number ?? "")),
      };
      if (staff) {
        staff.Credentials = [...(staff.Credentials ?? []), cred];
      }
      return successResponse(id);
    },
    [TMC_METHODS.CREDENTIALS_MODIFY]: (data) => {
      const body = data as Record<string, unknown>;
      const staffId = String(body.StaffId ?? "");
      const credId = String(body.Id ?? "");
      const staff = MOCK_STAFF.find((s) => s.Id === staffId || s.AccountId === staffId);
      if (staff?.Credentials) {
        const idx = staff.Credentials.findIndex((c) => c.Id === credId);
        if (idx >= 0) {
          staff.Credentials[idx] = {
            ...staff.Credentials[idx],
            Name: String(body.Name ?? staff.Credentials[idx].Name),
            Number: String(body.Number ?? staff.Credentials[idx].Number ?? ""),
            HideNumber: hideNumber(String(body.Number ?? staff.Credentials[idx].Number ?? "")),
            CredentialsType: Number(body.Type ?? staff.Credentials[idx].CredentialsType),
            Type: Number(body.Type ?? staff.Credentials[idx].Type),
          };
        }
      }
      return successResponse(body);
    },
    [TMC_METHODS.CREDENTIALS_REMOVE]: (data) => {
      const body = data as { Id?: string; StaffId?: string };
      const staff = MOCK_STAFF.find((s) => s.Id === body.StaffId || s.AccountId === body.StaffId);
      if (staff?.Credentials && body.Id) {
        staff.Credentials = staff.Credentials.filter((c) => c.Id !== body.Id);
      }
      return successResponse(true);
    },
    [TMC_METHODS.TMC_GETTMC]: () => successResponse(MOCK_TMC),
  };
}

export { MOCK_STAFF } from "../fixtures/passenger.js";
