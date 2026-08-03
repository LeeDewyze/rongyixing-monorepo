import type {
  HotelConditionResponse,
  HotelDetailResponse,
  HotelListItem,
  HotelListResponse,
  HotelPolicyPassengerResult,
} from "@ryx/shared-types";

const MOCK_HOTELS: HotelListItem[] = [
    {
      HotelId: "H10001",
      HotelName: "武汉泽宇国际酒店(北京方庄地铁站肿瘤医院店)",
      Address: "华岭路光明地产大厦",
      Star: 5,
      Grade: 4.8,
      Distance: "1.2公里",
      MinPrice: 563,
      ImageUrl: "https://picsum.photos/seed/hotel-wuhan-1/200/200",
      Tags: ["GreenCloud"],
    },
    {
      HotelId: "H10002",
      HotelName: "武汉洪山宾馆",
      Address: "武昌区中南路",
      Star: 4,
      Grade: 4.6,
      Distance: "850米",
      MinPrice: 428,
      ImageUrl: "https://picsum.photos/seed/hotel-wuhan-2/200/200",
      Tags: ["Tmc"],
    },
    {
      HotelId: "H10003",
      HotelName: "武汉万达瑞华酒店",
      Address: "东湖风景区沿湖大道",
      Star: 5,
      Grade: 4.9,
      Distance: "3.4公里",
      MinPrice: 888,
      ImageUrl: "https://picsum.photos/seed/hotel-wuhan-3/200/200",
    },
    {
      HotelId: "H10004",
      HotelName: "武汉光谷凯悦酒店",
      Address: "洪山区珞喻路1077号",
      Star: 5,
      Grade: 4.7,
      Distance: "2.1公里",
      MinPrice: 698,
      ImageUrl: "https://picsum.photos/seed/hotel-wuhan-4/200/200",
      Tags: ["GreenCloud", "Tmc"],
    },
    {
      HotelId: "H10005",
      HotelName: "武汉晴川假日酒店",
      Address: "汉阳区洗马湖路88号",
      Star: 4,
      Grade: 4.3,
      MinPrice: 368,
      ImageUrl: "https://picsum.photos/seed/hotel-wuhan-5/200/200",
    },
    ...Array.from({ length: 20 }, (_, index) => {
      const itemNo = index + 6;
      const stars = itemNo % 3 === 0 ? 5 : 4;
      return {
        HotelId: `H100${String(itemNo).padStart(2, "0")}`,
        HotelName: `武汉光谷精选酒店${itemNo}号店`,
        Address: `洪山区软件园${itemNo}路${itemNo * 8}号`,
        Star: stars,
        Grade: Number((4.1 + (index % 8) * 0.1).toFixed(1)),
        Distance: `${(0.6 + index * 0.2).toFixed(1)}公里`,
        MinPrice: 320 + index * 18,
        ImageUrl: `https://picsum.photos/seed/hotel-wuhan-${itemNo}/200/200`,
        Tags: itemNo % 4 === 0 ? ["GreenCloud", "Tmc"] : itemNo % 2 === 0 ? ["Tmc"] : undefined,
      };
    }),
];

export const MOCK_HOTEL_LIST: HotelListResponse = {
  TotalCount: MOCK_HOTELS.length,
  Hotels: MOCK_HOTELS,
};

export const MOCK_HOTEL_CONDITIONS: HotelConditionResponse = {
  Tmc: {
    Id: "tmc-mock",
    GroupCompany: { Id: "group-mock" },
  },
  Geos: [
    {
      Id: "geo-metro-2-jianghan",
      Name: "江汉路",
      Tag: "Metro",
      VariablesObj: { SubName: "2号线" },
    },
    {
      Id: "geo-metro-2-zhongnan",
      Name: "中南路",
      Tag: "Metro",
      VariablesObj: { SubName: "2号线" },
    },
    { Id: "geo-district-wuchang", Name: "武昌区", Tag: "District" },
    { Id: "geo-district-hongshan", Name: "洪山区", Tag: "District" },
    { Id: "geo-mall-hanjie", Name: "楚河汉街", Tag: "Mall" },
    { Id: "geo-landmark-eastlake", Name: "东湖风景区", Tag: "Landmark" },
    { Id: "geo-company-mock", Name: "融易行总部", Tag: "Company", Number: "tmc-mock" },
  ],
  Brands: [
    { Id: "brand-atour", Name: "亚朵", Tag: "Comfort" },
    { Id: "brand-hampton", Name: "欢朋", Tag: "Comfort" },
    { Id: "brand-hanting", Name: "汉庭", Tag: "Economy" },
    { Id: "brand-hyatt", Name: "凯悦", Tag: "High" },
    { Id: "brand-wanda", Name: "万达瑞华", Tag: "Luxury" },
  ],
  Amenities: [
    { Id: "amenity-theme-business", Name: "商务出行", Tag: "Theme" },
    { Id: "amenity-theme-parent", Name: "亲子酒店", Tag: "Theme" },
    { Id: "amenity-service-pickup", Name: "接送服务", Tag: "Service" },
    { Id: "amenity-service-laundry", Name: "洗衣服务", Tag: "Service" },
    { Id: "amenity-facility-gym", Name: "健身房", Tag: "Facility" },
    { Id: "amenity-facility-parking", Name: "停车场", Tag: "Facility" },
  ],
};

export const MOCK_HOTEL_DETAIL: HotelDetailResponse = {
  HotelId: "H10001",
  HotelName: "融易行测试酒店（望京）",
  Address: "北京市朝阳区望京街10号",
  Star: 4,
  Phone: "010-88886666",
  Lat: 39.99,
  Lng: 116.48,
  CheckInOutTime: "入住时间：14:00以后 离店时间：12:00以前",
  BookingNotice:
    "酒店可接待大陆、港澳台及外国客人。根据《北京市宾馆不得主动提供的一次性用品目录》相关规定，自2020年5月1日起，酒店不得主动提供一次性用品；如需要可向酒店索取。",
  OpeningDate: "2020-07-01",
  RenovationDate: "2020-07-01",
  Introduction:
    "北京望京科技园亚朵酒店位于朝阳区望京高科技产业园，毗邻阿里巴巴总部、绿地中心、望京SOHO等，地铁14号线、15号线望京站步行可达。酒店以阅读和摄影为主题，配备竹居、出尘洗衣房、健身房等设施。",
  ImageUrls: [
    "https://picsum.photos/seed/hdetail1/800/500",
    "https://picsum.photos/seed/hdetail2/800/500",
  ],
  Rooms: [
    {
      RoomId: "R001",
      RoomName: "ICON 36城景大床客房",
      ImageUrl: "https://picsum.photos/seed/hroom1/200/200",
      ImageUrls: [
        "https://picsum.photos/seed/hroom1a/800/500",
        "https://picsum.photos/seed/hroom1b/800/500",
      ],
      ImageCount: 2,
      Specs: "1张1.98米特大床 36m² 2人入住 10-22层",
      Tags: ["城景", "浴缸"],
      Details: [
        { Label: "面积", Value: "36㎡" },
        { Label: "楼层", Value: "10-22层" },
        { Label: "上网情况", Value: "免费WiFi" },
        { Label: "床型名称", Value: "特大床" },
        { Label: "描述", Value: "" },
        { Label: "房间最大入住人数", Value: "2" },
        { Label: "窗型", Value: "城景" },
      ],
      Plans: [
        {
          PlanId: "P001",
          PlanName: "含早·可免费取消",
          Price: 398,
          Breakfast: "含双早",
          CancelPolicy: "入住前18:00可免费取消",
          LegacyId: "P001",
          TotalAmount: 398,
          Number: 3,
          SupplierNumber: 1,
          RoomPlanUniqueId: "mock-uniq-p001",
          PaymentType: 1,
          BeginDate: "2026-06-20T00:00:00",
          EndDate: "2026-06-21T00:00:00",
          VariablesObj: {
            RoomRateRule: "不可取消",
            ArrivalTime: ["2026-06-20 14:00", "2026-06-20 16:30", "2026-06-20 18:00"],
          },
          RoomPlanPrices: [{ Date: "2026-06-20", Price: 398 }],
        },
        {
          PlanId: "P002",
          PlanName: "不含早·不可取消",
          Price: 358,
          Breakfast: "不含早",
          CancelPolicy: "预订后不可取消",
          LegacyId: "0",
          SupplierType: 2,
          TotalAmount: 358,
          Number: 0,
          SupplierNumber: 1,
          RoomPlanUniqueId: "mock-uniq-p002",
        },
      ],
    },
    {
      RoomId: "R002",
      RoomName: "豪华双床房",
      ImageUrl: "https://picsum.photos/seed/hroom2/200/200",
      ImageCount: 4,
      Specs: "2张1.35米双人床 42m² 2人入住 8-15层",
      Tags: ["城景"],
      Plans: [
        {
          PlanId: "P003",
          PlanName: "含早·可免费取消",
          Price: 458,
          Breakfast: "含双早",
          CancelPolicy: "入住前18:00可免费取消",
          LegacyId: "P003",
          TotalAmount: 458,
          Number: 2,
          SupplierNumber: 1,
          RoomPlanUniqueId: "mock-uniq-p003",
        },
      ],
    },
  ],
};

export const MOCK_HOTEL_POLICY: HotelPolicyPassengerResult[] = [
  {
    PassengerKey: "S001",
    HotelPolicies: [
      { UniqueIdId: "mock-uniq-p001", IsAllowBook: true },
      { UniqueIdId: "mock-uniq-p002", IsAllowBook: false, Rules: ["已满房"] },
      {
        UniqueIdId: "mock-uniq-p003",
        IsAllowBook: false,
        Rules: ["超出差标，需审批"],
      },
    ],
  },
];
