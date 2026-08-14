import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getWorkflowApiSite,
  getWorkflowHost,
  getWorkflowSite,
  resolveWorkflowUrl,
} from "./workflow-site";

function stubCachedApiConfig(workflowWebsiteUrl?: string) {
  const setting = {
    Token: "",
    Urls: workflowWebsiteUrl ? { WorkflowWebsiteUrl: workflowWebsiteUrl } : {},
  };
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => (key === "ryx_api_config" ? JSON.stringify(setting) : null),
    setItem: () => {},
  });
}

describe("getWorkflowSite", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("prefers WorkflowWebsiteUrl from the loaded ApiConfig", () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://app.rtesp.com");
    stubCachedApiConfig("https://workflow.rongtrip.cn/");

    expect(getWorkflowSite()).toBe("https://workflow.rongtrip.cn");
    expect(getWorkflowHost()).toBe("workflow.rongtrip.cn");
  });

  it("derives the test environment site from the app base before ApiConfig loads", () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://app.rtesp.com");
    stubCachedApiConfig();

    expect(getWorkflowSite()).toBe("http://workflow.rtesp.com");
    expect(getWorkflowHost()).toBe("workflow.rtesp.com");
  });

  it("derives the production site from the app base before ApiConfig loads", () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://app.rongtrip.cn");
    stubCachedApiConfig();

    expect(getWorkflowSite()).toBe("https://workflow.rongtrip.cn");
    expect(getWorkflowHost()).toBe("workflow.rongtrip.cn");
  });

  it("falls back to production when the app base is unusable", () => {
    vi.stubEnv("VITE_API_BASE_URL", "not-a-url");
    stubCachedApiConfig();

    expect(getWorkflowSite()).toBe("https://workflow.rongtrip.cn");
  });

  it("derives the workflow API site from the app base", () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://app.rongtrip.cn");
    stubCachedApiConfig();
    expect(getWorkflowApiSite()).toBe("https://api-workflow.rongtrip.cn");
  });
});

describe("resolveWorkflowUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("rewrites legacy workflow hosts to the active workflow site", () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://app.rongtrip.cn");
    stubCachedApiConfig("https://workflow.rongtrip.cn/");

    expect(
      resolveWorkflowUrl("http://workflow.rtesp.com/FormTask/Handle?flowtag=Travel&taskid=1"),
    ).toBe("https://workflow.rongtrip.cn/FormTask/Handle?flowtag=Travel&taskid=1");
  });

  it("leaves non-workflow URLs unchanged", () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://app.rongtrip.cn");
    expect(resolveWorkflowUrl("https://app.rongtrip.cn/home")).toBe("https://app.rongtrip.cn/home");
  });
});
