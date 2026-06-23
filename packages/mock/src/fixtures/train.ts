import type { TrainItem, TrainSearchParams } from "@ryx/shared-types";

export const MOCK_TRAIN_STATIONS = [
  {
    Id: "1",
    Code: "BJP",
    Name: "北京",
    Nickname: "北京",
    Pinyin: "beijing",
    IsHot: true,
  },
  {
    Id: "2",
    Code: "SHH",
    Name: "上海",
    Nickname: "上海",
    Pinyin: "shanghai",
    IsHot: true,
  },
  {
    Id: "3",
    Code: "NJH",
    Name: "南京",
    Nickname: "南京",
    Pinyin: "nanjing",
    IsHot: true,
  },
  {
    Id: "4",
    Code: "HZH",
    Name: "杭州",
    Nickname: "杭州",
    Pinyin: "hangzhou",
    IsHot: true,
  },
  {
    Id: "5",
    Code: "GZQ",
    Name: "广州",
    Nickname: "广州",
    Pinyin: "guangzhou",
    IsHot: true,
  },
  {
    Id: "6",
    Code: "SZQ",
    Name: "深圳",
    Nickname: "深圳",
    Pinyin: "shenzhen",
    IsHot: true,
  },
  {
    Id: "7",
    Code: "CDW",
    Name: "成都",
    Nickname: "成都",
    Pinyin: "chengdu",
    IsHot: false,
  },
  {
    Id: "8",
    Code: "WHN",
    Name: "武汉",
    Nickname: "武汉",
    Pinyin: "wuhan",
    IsHot: false,
  },
];

export function createMockTrainList(params: TrainSearchParams): TrainItem[] {
  return [
    {
      Id: "T1",
      TrainCode: "G1",
      StartTime: `${params.Date} 09:00`,
      ArrivalTime: `${params.Date} 13:28`,
      FromStation: params.FromName ?? params.FromStation,
      ToStation: params.ToName ?? params.ToStation,
      Duration: "4小时28分",
      LowestPrice: 553,
      Seats: [
        { SeatTypeName: "二等座", Price: 553, Count: 99 },
        { SeatTypeName: "一等座", Price: 933, Count: 20 },
      ],
    },
    {
      Id: "T2",
      TrainCode: "G3",
      StartTime: `${params.Date} 14:00`,
      ArrivalTime: `${params.Date} 18:28`,
      FromStation: params.FromName ?? params.FromStation,
      ToStation: params.ToName ?? params.ToStation,
      Duration: "4小时28分",
      LowestPrice: 553,
      Seats: [
        { SeatTypeName: "二等座", Price: 553, Count: 50 },
        { SeatTypeName: "商务座", Price: 1748, Count: 5 },
      ],
    },
    {
      Id: "T3",
      TrainCode: "K101",
      StartTime: `${params.Date} 22:30`,
      ArrivalTime: `${params.Date} 14:15`,
      FromStation: params.FromName ?? params.FromStation,
      ToStation: params.ToName ?? params.ToStation,
      Duration: "15小时45分",
      LowestPrice: 189,
      Seats: [
        { SeatTypeName: "硬座", Price: 189, Count: 99 },
        {
          SeatTypeName: "硬卧",
          Price: 322,
          Count: 12,
          BedInfos: [
            { BedTypeName: "上铺", Price: 298 },
            { BedTypeName: "中铺", Price: 310 },
            { BedTypeName: "下铺", Price: 322 },
          ],
        },
        {
          SeatTypeName: "软卧",
          Price: 504,
          Count: 2,
          BedInfos: [
            { BedTypeName: "上铺", Price: 480 },
            { BedTypeName: "下铺", Price: 504 },
          ],
        },
        { SeatTypeName: "无座", Price: 189, Count: 99 },
      ],
    },
  ];
}
