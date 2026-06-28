import type { TravelFormDto } from "@ryx/shared-types";

export const MOCK_TRAVEL_FORMS: TravelFormDto[] = [
  {
    Id: "TF001",
    TravelNumber: "TR20260615001",
    Title: "北京出差",
    StartDate: "2026-06-20",
    EndDate: "2026-06-22",
    Status: "Approved",
    StatusName: "已审批",
    Destination: "北京",
  },
  {
    Id: "TF002",
    TravelNumber: "TR20260615002",
    Title: "上海会议",
    StartDate: "2026-07-01",
    EndDate: "2026-07-03",
    Status: "Pending",
    StatusName: "审批中",
    Destination: "上海",
  },
];

export const MOCK_TRAVEL_FORM_LIST = {
  TravelForms: MOCK_TRAVEL_FORMS,
  TotalCount: MOCK_TRAVEL_FORMS.length,
};

/** ryx GetTravelUrl mock shape (beeant ITravelUrlResult wrapper). */
export const MOCK_TRAVEL_URL_RESULT = {
  key: "",
  value: {
    Data: MOCK_TRAVEL_FORMS.map((form) => ({
      TravelFormId: form.Id,
      TravelNumber: form.TravelNumber,
      Subject: form.Title,
      StartDate: form.StartDate,
      EndDate: form.EndDate,
      Status: form.StatusName,
      StatusType: form.Status,
      OrganizationName: form.Title,
      Trips: form.Destination ? [form.Destination] : [],
      Passengers: [],
    })),
    Message: "",
  },
};

export const MOCK_STAFF = {
  Id: "S001",
  AccountId: "10001",
  Name: "姜建康",
  Nickname: "姜建康",
  Mobile: "13800138000",
  Department: "融易行-技术部",
  OrganizationCode: "RYX-TECH",
  OrganizationName: "融易行-技术部",
  CostCenterCode: "CC-TECH",
  CostCenterName: "技术研发中心",
  BookType: 1,
  BookTypeName: "本人预订",
};
