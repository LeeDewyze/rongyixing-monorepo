import type { TrainScheduleStop } from "@ryx/shared-types";

export function createMockTrainScheduleStops(trainCode: string): TrainScheduleStop[] {
  const code = trainCode.toUpperCase();
  if (code.startsWith("G") || code.startsWith("D")) {
    return [
      { StationName: "北京南", DepartTime: "09:00", ArriveTime: "09:00", StopoverTime: "—" },
      { StationName: "天津南", DepartTime: "09:35", ArriveTime: "09:33", StopoverTime: "2分" },
      { StationName: "济南西", DepartTime: "11:05", ArriveTime: "11:03", StopoverTime: "2分" },
      { StationName: "南京南", DepartTime: "13:10", ArriveTime: "13:08", StopoverTime: "2分" },
      { StationName: "上海虹桥", DepartTime: "13:28", ArriveTime: "13:28", StopoverTime: "—" },
    ];
  }

  return [
    { StationName: "北京", DepartTime: "22:30", ArriveTime: "22:30", StopoverTime: "—" },
    { StationName: "天津", DepartTime: "00:15", ArriveTime: "00:10", StopoverTime: "5分" },
    { StationName: "徐州", DepartTime: "06:40", ArriveTime: "06:35", StopoverTime: "5分" },
    { StationName: "上海", DepartTime: "14:15", ArriveTime: "14:15", StopoverTime: "—" },
  ];
}
