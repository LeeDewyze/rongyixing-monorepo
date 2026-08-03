import { afterEach, describe, expect, it, vi } from "vitest";

import { getWorkflowHost, getWorkflowSite } from "./workflow-site";

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
});
