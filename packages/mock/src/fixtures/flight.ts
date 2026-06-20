import type { TrafficlineDto } from "@ryx/shared-types";

function line(
  code: string,
  name: string,
  pinyin: string,
  extra?: Partial<TrafficlineDto>,
): TrafficlineDto {
  return {
    Id: code,
    Code: code,
    Name: name,
    Nickname: name,
    Pinyin: pinyin,
    FirstLetter: pinyin.charAt(0).toUpperCase(),
    ...extra,
  };
}

export const MOCK_DOMESTIC_AIRPORTS: TrafficlineDto[] = [
  line("BJS", "北京", "beijing", { IsHot: true, CityName: "北京" }),
  line("SHA", "上海", "shanghai", { IsHot: true, CityName: "上海" }),
  line("SZX", "深圳", "shenzhen", { IsHot: true, CityName: "深圳" }),
  line("CAN", "广州", "guangzhou", { IsHot: true, CityName: "广州" }),
  line("CTU", "成都", "chengdu", { IsHot: true, CityName: "成都" }),
  line("TSN", "天津", "tianjin", { IsHot: true, CityName: "天津" }),
  line("CKG", "重庆", "chongqing", { IsHot: true, CityName: "重庆" }),
  line("NKG", "南京", "nanjing", { IsHot: true, CityName: "南京" }),
  line("SIA", "西安", "xian", { IsHot: true, CityName: "西安" }),
  line("AHJ", "阿坝", "aba", { CityName: "阿坝" }),
  line("YIE", "阿尔山", "aershan", { CityName: "阿尔山" }),
  line("AKA", "安康", "ankang", { CityName: "安康" }),
  line("AKU", "阿克苏", "akesu", { CityName: "阿克苏" }),
  line("NGQ", "阿里", "ali", { CityName: "阿里" }),
  line("AQG", "安庆", "anqing", { CityName: "安庆" }),
  line("AYN", "安阳", "anyang", { CityName: "安阳" }),
  line("BAV", "包头", "baotou", { FirstLetter: "B", CityName: "包头" }),
  line("BSD", "保山", "baoshan", { FirstLetter: "B", CityName: "保山" }),
];
