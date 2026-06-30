import { describe, expect, it } from "vitest";

import {
  createHotelApi,
  buildHotelDetailRequest,
  normalizeHotelDetailResponse,
  normalizeHotelPolicyResponse,
} from "./hotel.js";
import { createProxyClient } from "../proxy/proxy-client.js";
import { successResponse } from "../proxy/response-adapter.js";
import { HOTEL_FLOW_METHODS } from "../methods/hotel-flow.js";
import { HOTEL_METHODS } from "../methods/hotel.js";

describe("createHotelApi (mock mode)", () => {
  const proxy = createProxyClient({
    baseUrl: "https://example.com",
    mode: "mock",
    mockHandler: async (method) => {
      if (method === HOTEL_FLOW_METHODS.LIST) {
        return successResponse({ Hotels: [{ HotelId: "H1", HotelName: "Test" }], TotalCount: 1 });
      }
      return successResponse(null);
    },
  });
  const hotel = createHotelApi(proxy);

  it("getList returns hotel array", async () => {
    const result = await hotel.getList({ CityCode: "010" });
    expect(result.Hotels).toHaveLength(1);
    expect(result.Hotels[0]?.HotelId).toBe("H1");
  });

  it("getList includes CityName in request data", async () => {
    let capturedData: unknown;
    const proxyWithCapture = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async (method, data) => {
        if (method === HOTEL_FLOW_METHODS.LIST) {
          capturedData = data;
          return successResponse({ Hotels: [], TotalCount: 0 });
        }
        return successResponse(null);
      },
    });
    const api = createHotelApi(proxyWithCapture);
    await api.getList({
      CityCode: "1101",
      CityName: "北京",
      CheckInDate: "2026-06-22",
      CheckOutDate: "2026-06-23",
      Orderby: "PriceAsc",
      BeginPrice: 150,
      EndPrice: 300,
      Categories: ["4", "5"],
      Geos: ["geo-1"],
      Brands: ["brand-1"],
      Themes: ["theme-1"],
      Services: ["service-1"],
      Facilities: ["facility-1"],
      TravelFormId: "tf-1",
      Passengers: "staff-1,staff-2",
      StaffCityCode: "010",
      Lat: "39.9",
      Lng: "116.4",
    });
    expect(capturedData).toMatchObject({
      CityCode: "1101",
      CityName: "北京",
      BeginDate: "2026-06-22",
      EndDate: "2026-06-23",
      PageSize: 20,
      Orderby: "PriceAsc",
      BeginPrice: 150,
      EndPrice: 300,
      Categories: ["4", "5"],
      Geos: ["geo-1"],
      Brands: ["brand-1"],
      Themes: ["theme-1"],
      Services: ["service-1"],
      Facilities: ["facility-1"],
      travelformid: "tf-1",
      Passengers: "staff-1,staff-2",
      staffCityCode: "010",
      Lat: "39.9",
      Lng: "116.4",
    });
  });

  it("getConditions calls legacy Condition-Gets", async () => {
    let capturedMethod = "";
    let capturedData: unknown;
    const proxyWithCapture = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async (method, data) => {
        capturedMethod = method;
        capturedData = data;
        return successResponse({
          Geos: [{ Id: "geo-1", Name: "行政区", Tag: "District" }],
          Brands: [{ Id: "brand-1", Name: "亚朵", Tag: "Comfort" }],
          Amenities: [{ Id: "amenity-1", Name: "健身房", Tag: "Facility" }],
          Tmc: { Id: "tmc-1" },
        });
      },
    });
    const api = createHotelApi(proxyWithCapture);
    const result = await api.getConditions({ CityCode: "1101" });

    expect(capturedMethod).toBe(HOTEL_METHODS.CONDITION_GETS);
    expect(capturedData).toEqual({ cityCode: "1101" });
    expect(result.Geos[0]?.Id).toBe("geo-1");
    expect(result.Brands[0]?.Name).toBe("亚朵");
    expect(result.Amenities[0]?.Tag).toBe("Facility");
    expect(result.Tmc?.Id).toBe("tmc-1");
  });

  it("getList normalizes legacy HotelDayPrices response", async () => {
    const proxyLegacy = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async (method) => {
        if (method === HOTEL_FLOW_METHODS.LIST) {
          return successResponse({
            HotelDayPrices: [
              {
                AvgPrice: 696,
                MinPrice: 622,
                Hotel: {
                  Id: "H10001",
                  Name: "武汉泽宇国际酒店",
                  Address: "华岭路光明地产大厦",
                  Category: "5",
                  Grade: "4.8",
                  Distance: "1.2公里",
                  FullFileName: "https://example.com/hotel.jpg",
                  Tag: "GreenCloud,Tmc",
                  Variables: JSON.stringify({ AvgPrice: 696 }),
                },
              },
            ],
            DataCount: 1,
          });
        }
        return successResponse(null);
      },
    });
    const legacyApi = createHotelApi(proxyLegacy);
    const result = await legacyApi.getList({
      CityCode: "027",
      CheckInDate: "2026-05-24",
      CheckOutDate: "2026-05-28",
      HotelType: "Normal",
    });
    expect(result.Hotels).toHaveLength(1);
    expect(result.Hotels[0]?.HotelName).toBe("武汉泽宇国际酒店");
    expect(result.Hotels[0]?.Star).toBe(5);
    expect(result.Hotels[0]?.Grade).toBe(4.8);
    expect(result.Hotels[0]?.Distance).toBe("1.2公里");
    expect(result.Hotels[0]?.MinPrice).toBe(696);
    expect(result.Hotels[0]?.Tags).toContain("GreenCloud");
    expect(result.Hotels[0]?.Tags).toContain("Tmc");
  });

  it("getList prefers item.AvgPrice over Variables when both exist", async () => {
    const proxyLegacy = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async (method) => {
        if (method === HOTEL_FLOW_METHODS.LIST) {
          return successResponse({
            HotelSearchResultDtoList: [
              {
                AvgPrice: 696,
                Hotel: {
                  Id: "H10001",
                  Name: "测试酒店",
                  AvgPrice: 622,
                  Variables: JSON.stringify({ AvgPrice: 622 }),
                },
              },
            ],
            DataCount: 1,
          });
        }
        return successResponse(null);
      },
    });
    const legacyApi = createHotelApi(proxyLegacy);
    const result = await legacyApi.getList({ CityCode: "010" });
    expect(result.Hotels[0]?.MinPrice).toBe(696);
  });

  it("getList prefers Variables.AvgPrice over Hotel.AvgPrice when item missing", async () => {
    const proxyLegacy = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async (method) => {
        if (method === HOTEL_FLOW_METHODS.LIST) {
          return successResponse({
            HotelDayPrices: [
              {
                Hotel: {
                  Id: "H10001",
                  Name: "测试酒店",
                  AvgPrice: 622,
                  Variables: JSON.stringify({ AvgPrice: 696 }),
                },
              },
            ],
            DataCount: 1,
          });
        }
        return successResponse(null);
      },
    });
    const legacyApi = createHotelApi(proxyLegacy);
    const result = await legacyApi.getList({ CityCode: "010" });
    expect(result.Hotels[0]?.MinPrice).toBe(696);
  });

  it("getList reads AvgPrice from Hotel Variables object", async () => {
    const proxyLegacy = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async (method) => {
        if (method === HOTEL_FLOW_METHODS.LIST) {
          return successResponse({
            HotelDayPrices: [
              {
                Hotel: {
                  Id: "H10002",
                  Name: "协议酒店示例",
                  VariablesObj: { AvgPrice: 428 },
                },
              },
            ],
            DataCount: 1,
          });
        }
        return successResponse(null);
      },
    });
    const legacyApi = createHotelApi(proxyLegacy);
    const result = await legacyApi.getList({ CityCode: "027" });
    expect(result.Hotels[0]?.MinPrice).toBe(428);
  });

  it("getList reads AvgPrice from Hotel Variables string", async () => {
    const proxyLegacy = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async (method) => {
        if (method === HOTEL_FLOW_METHODS.LIST) {
          return successResponse({
            HotelDayPrices: [
              {
                Hotel: {
                  Id: "H10002",
                  Name: "协议酒店示例",
                  Variables: JSON.stringify({ AvgPrice: 428 }),
                },
              },
            ],
            DataCount: 1,
          });
        }
        return successResponse(null);
      },
    });
    const legacyApi = createHotelApi(proxyLegacy);
    const result = await legacyApi.getList({ CityCode: "027" });
    expect(result.Hotels[0]?.MinPrice).toBe(428);
  });

  it("getCities unwraps Trafficlines response", async () => {
    const proxyWithCities = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async () =>
        successResponse({
          Trafficlines: [
            { Code: "010", Name: "北京", Pinyin: "beijing", IsHot: true },
            { Code: "021", Nickname: "上海", Pinyin: "shanghai", IsHot: true },
          ],
        }),
    });
    const api = createHotelApi(proxyWithCities);
    const cities = await api.getCities();
    expect(cities).toHaveLength(2);
    expect(cities[0]?.Name).toBe("北京");
    expect(cities[1]?.Name).toBe("上海");
  });

  it("getCityByMap unwraps legacy city response", async () => {
    const proxyWithCityByMap = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async (method) => {
        if (method === HOTEL_METHODS.CITY_GETCITYBYMAP) {
          return successResponse({
            Data: {
              Code: "010",
              Name: "北京",
              Pinyin: "beijing",
              IsHot: true,
            },
          });
        }
        return successResponse(null);
      },
    });
    const api = createHotelApi(proxyWithCityByMap);
    const city = await api.getCityByMap({ lat: 39.9042, lng: 116.4074 });
    expect(city?.Code).toBe("010");
    expect(city?.Name).toBe("北京");
  });
});

describe("buildHotelDetailRequest", () => {
  it("maps detail params to legacy Home-Detail fields", () => {
    expect(
      buildHotelDetailRequest({
        HotelId: "10627",
        CityCode: "010",
        CheckInDate: "2026-06-24",
        CheckOutDate: "2026-06-25",
        MinPrice: 622,
        HotelType: "Normal",
      }),
    ).toEqual({
      HotelId: "10627",
      CityCode: "010",
      BeginDate: "2026-06-24",
      EndDate: "2026-06-25",
      IsLoadDetail: true,
      hotelType: "Normal",
      travelformid: "",
      MinPrice: "622",
    });
  });
});

describe("normalizeHotelDetailResponse", () => {
  it("maps legacy Hotel tree with rooms and plans", () => {
    const result = normalizeHotelDetailResponse(
      {
        Hotel: {
          Id: "10627",
          Name: "北京朝阳望京科技园亚朵酒店",
          Address: "宏昌路望京西园1区119号楼北侧",
          Category: "4",
          Phone: "010-12345678",
          Lat: 39.99,
          Lng: 116.48,
          HotelImages: [{ FullFileName: "https://example.com/hero.jpg" }],
          Rooms: [
            {
              Id: "R001",
              Name: "高级大床房",
              FullFileName: "https://example.com/room.jpg",
              RoomPlans: [
                {
                  Id: "P001",
                  Name: "含早·可免费取消",
                  TotalAmount: 796,
                  Number: 3,
                  SupplierNumber: 1,
                  Variables: JSON.stringify({
                    RoomPlanUniqueId: "uniq-796",
                    Breakfast: "含双早",
                    AvgPrice: 796,
                  }),
                  RoomPlanRules: [{ Description: "入住前18:00可免费取消" }],
                },
              ],
            },
          ],
        },
      },
      {
        HotelId: "10627",
        CityCode: "010",
        CheckInDate: "2026-06-24",
        CheckOutDate: "2026-06-25",
      },
    );

    expect(result.HotelName).toBe("北京朝阳望京科技园亚朵酒店");
    expect(result.Star).toBe(4);
    expect(result.ImageUrls).toEqual(["https://example.com/hero.jpg"]);
    expect(result.Rooms?.[0]?.RoomName).toBe("高级大床房");
    expect(result.Rooms?.[0]?.Plans[0]?.Price).toBe(796);
    expect(result.Rooms?.[0]?.Plans[0]?.RoomPlanUniqueId).toBe("uniq-796");
    expect(result.Rooms?.[0]?.Plans[0]?.SupplierNumber).toBe(1);
    expect(result.Rooms?.[0]?.ImageUrl).toBe("https://example.com/room.jpg");
  });

  it("preserves string SupplierNumber from legacy detail", () => {
    const result = normalizeHotelDetailResponse(
      {
        Hotel: {
          Id: "10627",
          Name: "Test Hotel",
          Rooms: [
            {
              Id: "196354",
              Name: "大床",
              RoomPlans: [
                {
                  Id: "0",
                  Name: "含早",
                  TotalAmount: 540,
                  SupplierNumber: "RM1008773489DPRS24754919_8FE52E35AC3FE08F0B1B1ABB1E7DE831",
                  SupplierType: "Dttrip",
                  BeginDate: "2026-06-26T00:00:00",
                  EndDate: "2026-06-27T00:00:00",
                  Variables: JSON.stringify({
                    RoomPlanUniqueId: "uniq-dttrip",
                  }),
                },
              ],
            },
          ],
        },
      },
      {
        HotelId: "10627",
        CheckInDate: "2026-06-26",
        CheckOutDate: "2026-06-27",
      },
    );

    expect(result.Rooms?.[0]?.Plans[0]?.SupplierNumber).toBe(
      "RM1008773489DPRS24754919_8FE52E35AC3FE08F0B1B1ABB1E7DE831",
    );
    expect(result.Rooms?.[0]?.Plans[0]?.BeginDate).toBe("2026-06-26T00:00:00");
    expect(result.Rooms?.[0]?.Plans[0]?.SupplierType).toBe("Dttrip");
  });

  it("maps legacy hotel info fields for detail section", () => {
    const result = normalizeHotelDetailResponse({
      Hotel: {
        Id: "10627",
        Name: "北京朝阳望京科技园亚朵酒店",
        ArrivalTime: 14,
        DepartureTime: 12,
        EstablishmentDate: "2020-07-01",
        RenovationDate: "2020-07-01",
        IntroEditor: "酒店简介正文",
        BookingNotice: "预订须知正文",
      },
    });

    expect(result.CheckInOutTime).toBe("入住时间：14:00以后 离店时间：12:00以前");
    expect(result.OpeningDate).toBe("2020-07-01");
    expect(result.RenovationDate).toBe("2020-07-01");
    expect(result.Introduction).toBe("酒店简介正文");
    expect(result.BookingNotice).toBe("预订须知正文");
  });

  it("maps hotel info fields from Variables when top-level fields are absent", () => {
    const result = normalizeHotelDetailResponse({
      Hotel: {
        Id: "10627",
        Name: "测试酒店",
        Variables: JSON.stringify({
          CheckInTime: "15:30",
          CheckOutTime: "11:00",
          EstablishmentDate: "2018-06",
          RenovationDate: "1900-01",
          Description: "来自 Variables 的简介",
        }),
      },
    });

    expect(result.CheckInOutTime).toBe("入住时间：15:30以后 离店时间：11:00以前");
    expect(result.OpeningDate).toBe("2018-06-01");
    expect(result.RenovationDate).toBeUndefined();
    expect(result.Introduction).toBe("来自 Variables 的简介");
  });

  it("maps hotel info fields from legacy HotelDetails array", () => {
    const result = normalizeHotelDetailResponse({
      Hotel: {
        Id: "10627",
        Name: "北京朝阳望京科技园亚朵酒店",
        HotelDetails: [
          { Tag: "ArrivalTime", Name: "入离时间", Description: "14" },
          { Tag: "DepartureTime", Name: "入离时间", Description: "12" },
          {
            Tag: "Reminder",
            Name: "预订须知",
            Description: "酒店可接待大陆、港澳台及外国客人。",
          },
          { Tag: "EstablishmentDate", Name: "开业时间", Description: "2020-07-01" },
          { Tag: "RenovationDate", Name: "装修时间", Description: "2020-07-01" },
          {
            Tag: "IntroEditor",
            Name: "简介",
            Description: "<p>酒店位于朝阳区望京高科技产业园。</p>",
          },
        ],
      },
    });

    expect(result.CheckInOutTime).toBe("入住时间：14:00以后 离店时间：12:00以前");
    expect(result.BookingNotice).toBe("酒店可接待大陆、港澳台及外国客人。");
    expect(result.OpeningDate).toBe("2020-07-01");
    expect(result.RenovationDate).toBe("2020-07-01");
    expect(result.Introduction).toBe("酒店位于朝阳区望京高科技产业园。");
  });

  it("uses RoomDefaultImg when room has no gallery images", () => {
    const result = normalizeHotelDetailResponse({
      RoomDefaultImg: "http://shared.rtesp.com/img/roomDefault.png?v=1782280618273",
      Hotel: {
        Id: "10627",
        Name: "测试酒店",
        Rooms: [
          { Id: "R001", Name: "行政双床房", RoomPlans: [] },
          { Id: "R002", Name: "大床房", RoomPlans: [] },
        ],
        HotelImages: [
          {
            ImageUrl: "https://cdn.example.com/Hotel350_350/room-b.jpg",
            Room: { Id: "R002" },
          },
        ],
      },
    });

    expect(result.RoomDefaultImg).toBe(
      "http://shared.rtesp.com/img/roomDefault.png?v=1782280618273",
    );
    expect(result.Rooms?.[0]?.ImageUrl).toBe(
      "http://shared.rtesp.com/img/roomDefault.png?v=1782280618273",
    );
    expect(result.Rooms?.[0]?.ImageCount).toBe(1);
    expect(result.Rooms?.[1]?.ImageUrl).toBe("https://cdn.example.com/Hotel70_70/room-b.jpg");
  });

  it("maps room images from HotelImages filtered by Room.Id", () => {
    const result = normalizeHotelDetailResponse({
      Hotel: {
        Id: "10627",
        Name: "测试酒店",
        HotelImages: [
          { FullFileName: "https://example.com/hero.jpg" },
          {
            ImageUrl: "https://cdn.example.com/Mobile640_960/room-a-1.jpg",
            Room: { Id: "R001" },
          },
          {
            ImageUrl: "https://cdn.example.com/Mobile640_960/room-a-2.jpg",
            Room: { Id: "R001" },
          },
          {
            ImageUrl: "https://cdn.example.com/Mobile640_960/room-b-1.jpg",
            Room: { Id: "R002" },
          },
        ],
        Rooms: [
          { Id: "R001", Name: "大床房", RoomPlans: [] },
          { Id: "R002", Name: "双床房", RoomPlans: [] },
        ],
      },
    });

    expect(result.Rooms?.[0]?.ImageUrl).toBe("https://cdn.example.com/Hotel70_70/room-a-1.jpg");
    expect(result.Rooms?.[0]?.ImageCount).toBe(2);
    expect(result.Rooms?.[1]?.ImageUrl).toBe("https://cdn.example.com/Hotel70_70/room-b-1.jpg");
    expect(result.Rooms?.[1]?.ImageCount).toBe(1);
  });

  it("maps room images from RoomId field and protocol-relative urls", () => {
    const result = normalizeHotelDetailResponse({
      Hotel: {
        Id: "10627",
        Name: "测试酒店",
        HotelImages: [
          {
            ImageUrl: "//cdn.example.com/Mobile640_960/room-c-1.jpg",
            RoomId: "R003",
          },
        ],
        Rooms: [{ Id: "R003", Name: "套房", RoomPlans: [] }],
      },
    });

    expect(result.Rooms?.[0]?.ImageUrl).toBe("https://cdn.example.com/Hotel70_70/room-c-1.jpg");
    expect(result.Rooms?.[0]?.ImageUrlFallback).toBe(
      "https://cdn.example.com/Mobile640_960/room-c-1.jpg",
    );
  });

  it("maps elongstatic Hotel350_350 room images to Hotel70_70 thumbnails", () => {
    const result = normalizeHotelDetailResponse({
      Hotel: {
        Id: "10627",
        Name: "测试酒店",
        HotelImages: [
          { FullFileName: "https://pavo.elongstatic.com/i/Hotel350_350/nw_hero.jpg" },
          {
            ImageUrl: "https://pavo.elongstatic.com/i/Hotel350_350/nw_room.jpg",
            Room: { Id: "R001" },
            Type: 8,
          },
        ],
        Rooms: [{ Id: "R001", Name: "大床房", RoomPlans: [] }],
      },
    });

    expect(result.ImageUrls).toEqual([
      "https://pavo.elongstatic.com/i/Hotel350_350/nw_hero.jpg",
      "https://pavo.elongstatic.com/i/Hotel350_350/nw_room.jpg",
    ]);
    expect(result.Rooms?.[0]?.ImageUrl).toBe(
      "https://pavo.elongstatic.com/i/Hotel70_70/nw_room.jpg",
    );
  });

  it("maps room images from OwnerId and Locations array", () => {
    const result = normalizeHotelDetailResponse({
      Hotel: {
        Id: "10627",
        Name: "测试酒店",
        HotelImages: [
          {
            OwnerId: "R004",
            OwnerType: 2,
            Locations: [
              { Url: "https://cdn.example.com/Hotel350_350/room-d-1.jpg" },
              { Url: "https://cdn.example.com/Hotel350_350/room-d-2.jpg" },
            ],
          },
        ],
        Rooms: [{ Id: "R004", Name: "套房", RoomPlans: [] }],
      },
    });

    expect(result.Rooms?.[0]?.ImageUrl).toBe("https://cdn.example.com/Hotel70_70/room-d-1.jpg");
    expect(result.Rooms?.[0]?.ImageCount).toBe(2);
  });

  it("maps room images from room-level ImageUrl and ThumbNailUrl", () => {
    const result = normalizeHotelDetailResponse({
      Hotel: {
        Id: "10627",
        Name: "测试酒店",
        Rooms: [
          {
            Id: "R005",
            Name: "标准间",
            ImageUrl: "https://pavo.elongstatic.com/i/Hotel350_350/nw_direct.jpg",
            RoomPlans: [],
          },
        ],
      },
    });

    expect(result.Rooms?.[0]?.ImageUrl).toBe(
      "https://pavo.elongstatic.com/i/Hotel70_70/nw_direct.jpg",
    );
  });

  it("maps all HotelImages entries to carousel ImageUrls", () => {
    const result = normalizeHotelDetailResponse({
      Hotel: {
        Id: "10627",
        Name: "测试酒店",
        HotelImages: [
          { FullFileName: "https://pavo.elongstatic.com/i/Hotel350_350/nw_a.jpg", Room: { Id: 0 } },
          {
            FullFileName: "https://pavo.elongstatic.com/i/Hotel350_350/nw_b.jpg",
            Room: { Id: "0" },
          },
          { FullFileName: "https://pavo.elongstatic.com/i/Hotel350_350/nw_c.jpg" },
          {
            ImageUrl: "https://pavo.elongstatic.com/i/Hotel350_350/nw_room.jpg",
            Room: { Id: "R001" },
            Type: 8,
          },
        ],
        Rooms: [{ Id: "R001", Name: "大床房", RoomPlans: [] }],
      },
    });

    expect(result.ImageUrls).toEqual([
      "https://pavo.elongstatic.com/i/Hotel350_350/nw_a.jpg",
      "https://pavo.elongstatic.com/i/Hotel350_350/nw_b.jpg",
      "https://pavo.elongstatic.com/i/Hotel350_350/nw_c.jpg",
      "https://pavo.elongstatic.com/i/Hotel350_350/nw_room.jpg",
    ]);
  });

  it("maps camelCase hotelImages to carousel ImageUrls", () => {
    const result = normalizeHotelDetailResponse({
      hotel: {
        id: "10627",
        name: "测试酒店",
        hotelImages: [
          {
            imageUrl: "https://pavo.elongstatic.com/i/Hotel350_350/nw_1.jpg",
            room: { id: "R001" },
            type: 8,
          },
          {
            imageUrl: "https://pavo.elongstatic.com/i/Hotel350_350/nw_2.jpg",
            room: { id: "R002" },
            type: 8,
          },
        ],
        rooms: [{ id: "R001", name: "大床房", roomPlans: [] }],
      },
    });

    expect(result.ImageUrls).toEqual([
      "https://pavo.elongstatic.com/i/Hotel350_350/nw_1.jpg",
      "https://pavo.elongstatic.com/i/Hotel350_350/nw_2.jpg",
    ]);
  });

  it("picks one gallery url per image entry from Locations", () => {
    const result = normalizeHotelDetailResponse({
      Hotel: {
        Id: "10627",
        Name: "测试酒店",
        HotelImages: [
          {
            Locations: [
              { Url: "https://cdn.example.com/Hotel70_70/a.jpg" },
              { Url: "https://cdn.example.com/Hotel350_350/a.jpg" },
            ],
          },
          {
            Locations: [
              { Url: "https://cdn.example.com/Hotel70_70/b.jpg" },
              { Url: "https://cdn.example.com/Hotel350_350/b.jpg" },
            ],
          },
        ],
      },
    });

    expect(result.ImageUrls).toEqual([
      "https://cdn.example.com/Hotel350_350/a.jpg",
      "https://cdn.example.com/Hotel350_350/b.jpg",
    ]);
  });

  it("maps room RoomDetails to Details", () => {
    const result = normalizeHotelDetailResponse({
      Hotel: {
        Id: "H1",
        Name: "Test Hotel",
        Rooms: [
          {
            Id: "R001",
            Name: "大床房",
            RoomDetails: [
              { Name: "面积", Description: "20" },
              { Name: "楼层", Description: "1-3" },
              { Name: "床型名称", Description: "大床" },
            ],
            RoomPlans: [],
          },
        ],
      },
    });

    expect(result.Rooms?.[0]?.Details).toEqual([
      { Label: "面积", Value: "20", Tag: undefined },
      { Label: "楼层", Value: "1-3", Tag: undefined },
      { Label: "床型名称", Value: "大床", Tag: undefined },
    ]);
  });
});

describe("normalizeHotelPolicyResponse", () => {
  it("accepts legacy array and Policies wrapper", () => {
    const rows = [{ PassengerKey: "S001", HotelPolicies: [{ UniqueIdId: "u1" }] }];
    expect(normalizeHotelPolicyResponse(rows)).toEqual(rows);
    expect(normalizeHotelPolicyResponse({ Policies: rows })).toEqual(rows);
    expect(normalizeHotelPolicyResponse(null)).toEqual([]);
  });
});
