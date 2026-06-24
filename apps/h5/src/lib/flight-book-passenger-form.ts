import type {
  FlightInitStaff,
  FlightPassengerBookForm,
  FlightPassengerContactOption,
  PassengerBookInfo,
} from "@ryx/shared-types";

function splitContactOptions(raw: string | undefined, fallback?: string): FlightPassengerContactOption[] {
  const parts = (raw ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!parts.length && fallback?.trim()) {
    parts.push(fallback.trim());
  }
  return parts.map((value, index) => ({ value, checked: index === 0 }));
}

export function findInitStaffForPassenger(
  passenger: PassengerBookInfo,
  staffs: FlightInitStaff[] | undefined,
): FlightInitStaff | undefined {
  if (!staffs?.length) return undefined;
  const accountId = String(passenger.passenger.AccountId ?? passenger.id);
  return staffs.find((staff) => String(staff.Account?.Id ?? "") === accountId);
}

export function createPassengerBookForm(
  passenger: PassengerBookInfo,
  staff?: FlightInitStaff,
): FlightPassengerBookForm {
  const accountMobile = staff?.Account?.Mobile ?? passenger.credential.Mobile ?? passenger.passenger.Mobile;
  const mobileOptions = splitContactOptions(accountMobile, passenger.credential.Mobile);
  const emailOptions = splitContactOptions(staff?.Account?.Email ?? undefined);

  return {
    passengerId: passenger.id,
    mobileOptions,
    emailOptions,
    otherMobile:
      mobileOptions.length === 0
        ? (passenger.credential.Mobile ?? passenger.passenger.Mobile ?? "")
        : "",
    otherEmail: "",
    organization: {
      code: staff?.Organization?.Code ?? "",
      name:
        staff?.Organization?.Name ??
        passenger.credential.OrgName ??
        passenger.passenger.OrgName ??
        "",
    },
    otherOrganizationName: "",
    costCenter: {
      code: staff?.CostCenter?.Code ?? "",
      name: staff?.CostCenter?.Name ?? "",
    },
    otherCostCenterName: "",
    otherCostCenterCode: "",
    expanded: false,
    showTravelDetail: false,
    expenseType: "",
    illegalReason: "",
    otherIllegalReason: "",
    selectedInsuranceId: "",
    outNumbers: {},
    approvalId: "",
    selectedApproverName: "",
    isSkipApprove: false,
  };
}

export function mergeInitStaffIntoForm(
  form: FlightPassengerBookForm,
  passenger: PassengerBookInfo,
  staff?: FlightInitStaff,
): FlightPassengerBookForm {
  if (!staff) return form;
  const next = { ...form };
  if (!next.mobileOptions.length) {
    next.mobileOptions = createPassengerBookForm(passenger, staff).mobileOptions;
  }
  if (!next.emailOptions.length && staff.Account?.Email) {
    next.emailOptions = splitContactOptions(staff.Account.Email);
  }
  if (!next.organization.name) {
    next.organization = createPassengerBookForm(passenger, staff).organization;
  }
  if (!next.costCenter.name) {
    next.costCenter = createPassengerBookForm(passenger, staff).costCenter;
  }
  if (!next.otherMobile && !next.mobileOptions.length) {
    next.otherMobile = createPassengerBookForm(passenger, staff).otherMobile;
  }
  return next;
}

export function resolvePassengerFormMobile(form: FlightPassengerBookForm): string {
  const checked = form.mobileOptions.filter((item) => item.checked).map((item) => item.value);
  let mobile = checked.join(",");
  if (form.otherMobile.trim()) {
    mobile = mobile ? `${mobile},${form.otherMobile.trim()}` : form.otherMobile.trim();
  }
  return mobile;
}

export function resolvePassengerFormEmail(form: FlightPassengerBookForm): string {
  const checked = form.emailOptions.filter((item) => item.checked).map((item) => item.value);
  let email = checked.join(",");
  if (form.otherEmail.trim()) {
    email = email ? `${email},${form.otherEmail.trim()}` : form.otherEmail.trim();
  }
  return email;
}

export function validatePassengerBookForms(
  passengers: PassengerBookInfo[],
  forms: Record<string, FlightPassengerBookForm>,
): string | null {
  for (let index = 0; index < passengers.length; index += 1) {
    const passenger = passengers[index]!;
    const form = forms[passenger.id];
    if (!form) continue;
    const mobile = resolvePassengerFormMobile(form);
    if (!mobile) {
      return `${passenger.credential.Name ?? "乘机人"} 联系电话不能为空`;
    }
  }
  return null;
}

export function parseCostCenterLabel(text: string): string {
  const idx = text.lastIndexOf("-");
  return idx >= 0 ? text.slice(idx + 1) : text;
}
