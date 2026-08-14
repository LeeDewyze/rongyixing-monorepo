import { describe, expect, it } from "vitest";

import {
  notifierDisplayName,
  parseTravelLaunchNotifyTypes,
  parseTravelLaunchView,
  resolveTravelLaunchDiagram,
  splitTravelLaunchPeople,
} from "./travel-launch";

describe("parseTravelLaunchView", () => {
  it("reads approval records from the launch table", () => {
    const view = parseTravelLaunchView(`
      <table>
        <tr><th>审批人</th><th>状态</th><th>备注</th></tr>
        <tr><td>张海肖</td><td>待处理</td><td></td></tr>
      </table>
    `);
    expect(view.records).toEqual([{ approver: "张海肖", status: "待处理", remark: "" }]);
  });

  it("reads diagram nodes from formdetail-task blocks", () => {
    const view = parseTravelLaunchView(`
      <div class="formdetail-task">
        <div class="status">待处理</div>
        <div class="taskname">张海肖</div>
      </div>
    `);
    expect(view.nodes).toEqual([{ name: "张海肖", status: "待处理" }]);
  });

  it("ignores decorative notifier icons and uses records as diagram nodes", () => {
    const view = parseTravelLaunchView(`
      <table>
        <tr><th>审批人</th><th>状态</th><th>备注</th></tr>
        <tr><td>张海肖</td><td>待处理</td><td></td></tr>
      </table>
      <img src="/img/addnotifier.png" />
      <img src="/img/chacha.png" />
    `);
    expect(view.diagramImageUrls).toEqual([]);
    expect(resolveTravelLaunchDiagram(view).nodes).toEqual([{ name: "张海肖", status: "待处理" }]);
    expect(resolveTravelLaunchDiagram(view).steps).toEqual([
      { people: ["张海肖"], status: "待处理" },
    ]);
  });

  it("prefers the longer record list when diagram nodes are incomplete", () => {
    const view = parseTravelLaunchView(`
      <table>
        <tr><th>审批人</th><th>状态</th><th>备注</th></tr>
        <tr><td>张海肖</td><td>待处理</td><td></td></tr>
        <tr><td>李四</td><td>待处理</td><td></td></tr>
      </table>
      <div class="formdetail-task">
        <div class="status">待处理</div>
        <div class="taskname">张海肖</div>
      </div>
    `);
    expect(resolveTravelLaunchDiagram(view).steps).toEqual([
      { people: ["张海肖"], status: "待处理" },
      { people: ["李四"], status: "待处理" },
    ]);
  });
});

describe("splitTravelLaunchPeople", () => {
  it("splits same-node approvers and staff id prefixes", () => {
    expect(splitTravelLaunchPeople("张海肖、李四")).toEqual(["张海肖", "李四"]);
    expect(splitTravelLaunchPeople("1796564-张海肖")).toEqual(["张海肖"]);
  });
});

describe("parseTravelLaunchNotifyTypes", () => {
  it("reads notifyType options from the launch select", () => {
    expect(
      parseTravelLaunchNotifyTypes(`
        <select task="notifyType">
          <option value="">请选择</option>
          <option value="1">邮件</option>
          <option value="2">短信</option>
        </select>
      `),
    ).toEqual([
      { value: "1", label: "邮件" },
      { value: "2", label: "短信" },
    ]);
  });
});

describe("notifierDisplayName", () => {
  it("strips the staff number prefix", () => {
    expect(notifierDisplayName("1796564-张海肖")).toBe("张海肖");
    expect(notifierDisplayName("李四")).toBe("李四");
  });
});
