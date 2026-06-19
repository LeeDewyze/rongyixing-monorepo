import type { HotelDetailResponse, HotelListResponse } from "@ryx/shared-types";

export const MOCK_HOTEL_LIST: HotelListResponse = {
  TotalCount: 2,
  Hotels: [
    {
      HotelId: "H10001",
      HotelName: "融易行测试酒店（望京）",
      Address: "北京市朝阳区望京街10号",
      Star: 4,
      MinPrice: 398,
      ImageUrl: "https://picsum.photos/seed/hotel1/400/300",
    },
    {
      HotelId: "H10002",
      HotelName: "融易行商务酒店（国贸）",
      Address: "北京市朝阳区建国门外大街1号",
      Star: 5,
      MinPrice: 688,
      ImageUrl: "https://picsum.photos/seed/hotel2/400/300",
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
