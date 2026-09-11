import type {
  FlightInitStaff,
  FlightPassengerBookForm,
  FlightPassengerContactOption,
  PassengerBookInfo,
} from "@ryx/shared-types";

export function splitContactOptions(
  raw: string | undefined,
  fallback?: string,
): FlightPassengerContactOption[] {
  const parts = (raw ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!parts.length && fallback?.trim()) {
    parts.push(fallback.trim());
  }
  return parts.map((value, index) => ({ value, checked: index === 0 }));
}

function resolvePassengerAccountId(passenger: PassengerBookInfo): string {
  const passengerAccountId =
    "AccountId" in passenger.passenger ? passenger.passenger.AccountId : undefined;
  return String(passengerAccountId ?? passenger.credential.AccountId ?? passenger.id);
}

function resolvePassengerOrgName(passenger: PassengerBookInfo): string {
  const passengerOrgName =
    "OrgName" in passenger.passenger ? passenger.passenger.OrgName : undefined;
  return passenger.credential.OrgName ?? passengerOrgName ?? "";
}

export function findInitStaffForPassenger(
  passenger: PassengerBookInfo,
  staffs: FlightInitStaff[] | undefined,
): FlightInitStaff | undefined {
  if (!staffs?.length) return undefined;
  const accountId = resolvePassengerAccountId(passenger);
  return staffs.find((staff) => {
    const staffAccountId = String(staff.Account?.Id ?? staff.Id ?? "");
    return staffAccountId === accountId;
  });
}

export function createPassengerBookForm(
  passenger: PassengerBookInfo,
  staff?: FlightInitStaff,
): FlightPassengerBookForm {
  const accountMobile =
    staff?.Account?.Mobile ?? passenger.credential.Mobile ?? passenger.passenger.Mobile;
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
      name: staff?.Organization?.Name ?? resolvePassengerOrgName(passenger),
    },
    otherOrganizationName: "",
    costCenter: {
      code: staff?.CostCenter?.Code ?? "",
      name: staff?.CostCenter?.Name ?? "",
    },
    otherCostCenterName: "",
    otherCostCenterCode: "",
    expanded: false,
    showTravelDetail: true,
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
  const created = createPassengerBookForm(passenger, staff);
  const mobileOptions = form.mobileOptions.length ? form.mobileOptions : created.mobileOptions;
  const emailOptions =
    form.emailOptions.length || !staff.Account?.Email
      ? form.emailOptions
      : splitContactOptions(staff.Account.Email);
  const organization = form.organization.name ? form.organization : created.organization;
  const costCenter = form.costCenter.name ? form.costCenter : created.costCenter;
  const otherMobile =
    form.otherMobile || form.mobileOptions.length ? form.otherMobile : created.otherMobile;

  if (
    mobileOptions === form.mobileOptions &&
    emailOptions === form.emailOptions &&
    organization === form.organization &&
    costCenter === form.costCenter &&
    otherMobile === form.otherMobile
  ) {
    return form;
  }

  return {
    ...form,
    mobileOptions,
    emailOptions,
    organization,
    costCenter,
    otherMobile,
  };
}

export function syncPassengerBookForms(
  prev: Record<string, FlightPassengerBookForm>,
  passengers: PassengerBookInfo[],
  staffs: FlightInitStaff[] | undefined,
): Record<string, FlightPassengerBookForm> {
  const next: Record<string, FlightPassengerBookForm> = {};
  let changed = Object.keys(prev).length !== passengers.length;

  for (const passenger of passengers) {
    const staff = findInitStaffForPassenger(passenger, staffs);
    const existing = prev[passenger.id];
    const form = existing
      ? mergeInitStaffIntoForm(existing, passenger, staff)
      : createPassengerBookForm(passenger, staff);
    next[passenger.id] = form;
    if (form !== existing) changed = true;
  }

  return changed ? next : prev;
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
