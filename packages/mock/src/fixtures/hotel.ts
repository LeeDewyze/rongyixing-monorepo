import type { HotelDetailResponse, HotelListResponse } from "@ryx/shared-types";

export const MOCK_HOTEL_LIST: HotelListResponse = {
  TotalCount: 5,
  Hotels: [
    {
      HotelId: "H10001",
      HotelName: "武汉泽宇国际酒店(北京方庄地铁站肿瘤医院店)",
      Address: "华岭路光明地产大厦",
      Star: 5,
      MinPrice: 563,
      ImageUrl: "https://picsum.photos/seed/hotel-wuhan-1/200/200",
    },
    {
      HotelId: "H10002",
      HotelName: "武汉洪山宾馆",
      Address: "武昌区中南路",
      Star: 4,
      MinPrice: 428,
      ImageUrl: "https://picsum.photos/seed/hotel-wuhan-2/200/200",
      Tags: ["Tmc"],
    },
    {
      HotelId: "H10003",
      HotelName: "武汉万达瑞华酒店",
      Address: "东湖风景区沿湖大道",
      Star: 5,
      MinPrice: 888,
      ImageUrl: "https://picsum.photos/seed/hotel-wuhan-3/200/200",
    },
    {
      HotelId: "H10004",
      HotelName: "武汉光谷凯悦酒店",
      Address: "洪山区珞喻路1077号",
      Star: 5,
      MinPrice: 698,
      ImageUrl: "https://picsum.photos/seed/hotel-wuhan-4/200/200",
    },
    {
      HotelId: "H10005",
      HotelName: "武汉晴川假日酒店",
      Address: "汉阳区洗马湖路88号",
      Star: 4,
      MinPrice: 368,
      ImageUrl: "https://picsum.photos/seed/hotel-wuhan-5/200/200",
    },
  ],
};

export const MOCK_HOTEL_DETAIL: HotelDetailResponse = {
  HotelId: "H10001",
  HotelName: "融易行测试酒店（望京）",
  Address: "北京市朝阳区望京街10号",
  Star: 4,
  ImageUrls: [
    "https://picsum.photos/seed/hdetail1/800/500",
    "https://picsum.photos/seed/hdetail2/800/500",
  ],
  Rooms: [
    {
      RoomId: "R001",
      RoomName: "高级大床房",
      Plans: [
        {
          PlanId: "P001",
          PlanName: "含早·可免费取消",
          Price: 398,
          Breakfast: "含双早",
          CancelPolicy: "入住前18:00可免费取消",
        },
        {
          PlanId: "P002",
          PlanName: "不含早·不可取消",
          Price: 358,
          Breakfast: "不含早",
          CancelPolicy: "预订后不可取消",
        },
      ],
    },
    {
      RoomId: "R002",
      RoomName: "豪华双床房",
      Plans: [
        {
          PlanId: "P003",
          PlanName: "含早·可免费取消",
          Price: 458,
          Breakfast: "含双早",
          CancelPolicy: "入住前18:00可免费取消",
        },
      ],
    },
  ],
};
