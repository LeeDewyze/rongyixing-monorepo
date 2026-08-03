const { app, BrowserWindow, net, protocol, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

protocol.registerSchemesAsPrivileged([
  {
    scheme: "ryx",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

const isMac = process.platform === "darwin";

const DEFAULT_API_BASE_URL = "http://app.rtesp.com";
const DEFAULT_JYX_PROXY_TARGET = "http://ronglv-feature.rtesp.com";
const DEFAULT_API_HOME_TARGET = "http://api.rtesp.com";

const DEFAULT_RYX_SERVICE_TARGETS = {
  TmcApiHomeUrl: "http://api-tmc.rtesp.com",
  TmcApiHotelUrl: "http://hotel-api-tmc.rtesp.com",
  TmcApiFlightUrl: "http://flight-api-tmc.rtesp.com",
  TmcApiTrainUrl: "http://train-api-tmc.rtesp.com",
  TmcApiBookUrl: "http://book-api-tmc.rtesp.com",
  TmcApiOrderUrl: "http://order-api-tmc.rtesp.com",
  WorkflowApiUrl: "http://api-workflow.rtesp.com",
  ApiMemberUrl: "http://member-api.rtesp.com",
  ApiAccountUrl: "http://account-api.rtesp.com",
  HrApiUrl: "http://api-hr.rtesp.com",
  ApiPasswordUrl: "http://pass-api.rtesp.com",
  ApiLoginUrl: "http://login-api.rtesp.com",
  ApiHomeUrl: DEFAULT_API_HOME_TARGET,
  FeatureRonglvUrl: DEFAULT_JYX_PROXY_TARGET,
  TmcTouristFlightUrl: "http://flight-tourist-tmc.rtesp.com",
  TmcTouristTrainUrl: "http://train-tourist-tmc.rtesp.com",
  TmcTouristHotelUrl: "http://hotel-tourist-tmc.rtesp.com",
  TmcTouristBookUrl: "http://book-tourist-tmc.rtesp.com",
  TmcTouristOrderUrl: "http://order-tourist-tmc.rtesp.com",
};

function readRuntimeConfig() {
  const configPath = path.resolve(__dirname, "..", "generated", "runtime-config.json");
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch {
    return {};
  }
}

function getStartupUrl() {
  const devServer = process.env.RYX_WINDOWS_DEV_SERVER?.trim();
  if (devServer) return devServer;

  const runtimeConfig = readRuntimeConfig();
  const configuredServer = process.env.RYX_WINDOWS_SERVER_URL?.trim() || runtimeConfig.serverUrl;
  if (configuredServer) return configuredServer;

  return "ryx://app/";
}

function trimTrailingSlash(value) {
  return value.replace(/\/$/, "");
}

function getProxyConfig() {
  const runtimeConfig = readRuntimeConfig();
  return {
    apiBaseUrl:
      process.env.RYX_WINDOWS_API_BASE_URL?.trim() ||
      runtimeConfig.apiBaseUrl ||
      DEFAULT_API_BASE_URL,
    apiHomeUrl:
      process.env.RYX_WINDOWS_API_HOME_URL?.trim() ||
      runtimeConfig.apiHomeUrl ||
      DEFAULT_API_HOME_TARGET,
    jyxUrl:
      process.env.RYX_WINDOWS_JYX_URL?.trim() ||
      runtimeConfig.jyxUrl ||
      DEFAULT_JYX_PROXY_TARGET,
    serviceTargets: {
      ...DEFAULT_RYX_SERVICE_TARGETS,
      ...(runtimeConfig.serviceTargets || {}),
    },
  };
}

function resolveProxyTarget(requestUrl) {
  const config = getProxyConfig();
  const url = new URL(requestUrl);
  const pathname = decodeURIComponent(url.pathname);
  const search = url.search || "";

  if (pathname === "/Home/Setting" || pathname === "/Home/Proxy") {
    return `${trimTrailingSlash(config.apiBaseUrl)}${pathname}${search}`;
  }

  if (pathname.startsWith("/Identity")) {
    return `${trimTrailingSlash(config.apiHomeUrl)}${pathname}${search}`;
  }

  if (pathname.startsWith("/Jyx")) {
    return `${trimTrailingSlash(config.jyxUrl)}${pathname}${search}`;
  }

  const ryxPrefix = "/__ryx/";
  if (pathname.startsWith(ryxPrefix)) {
    const rest = pathname.slice(ryxPrefix.length);
    const slashIndex = rest.indexOf("/");
    const urlKey = slashIndex === -1 ? rest : rest.slice(0, slashIndex);
    const targetBase = config.serviceTargets[urlKey];
    if (!targetBase) return null;
    const targetPath = slashIndex === -1 ? "/" : rest.slice(slashIndex);
    return `${trimTrailingSlash(targetBase)}${targetPath}${search}`;
  }

  return null;
}

async function forwardProxyRequest(request, targetUrl) {
  const headers = Object.fromEntries(request.headers.entries());
  delete headers.host;
  delete headers["content-length"];

  const options = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    options.body = Buffer.from(await request.arrayBuffer());
  }

  return net.fetch(targetUrl, options);
}

function resolveBundledWebPath(requestUrl) {
  const webRoot = path.resolve(__dirname, "..", "web-dist");
  const indexPath = path.join(webRoot, "index.html");
  const url = new URL(requestUrl);
  const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const candidate = path.normalize(path.join(webRoot, requestedPath));

  if (!candidate.startsWith(webRoot)) return indexPath;
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  return indexPath;
}

function registerBundledWebProtocol() {
  protocol.handle("ryx", async (request) => {
    const proxyTarget = resolveProxyTarget(request.url);
    if (proxyTarget) {
      return forwardProxyRequest(request, proxyTarget);
    }

    const filePath = resolveBundledWebPath(request.url);
    return net.fetch(pathToFileURL(filePath).toString());
  });
}

function isInternalNavigation(targetUrl, currentUrl) {
  if (targetUrl.startsWith("ryx://app/")) return true;
  if (!currentUrl) return false;

  try {
    const target = new URL(targetUrl);
    const current = new URL(currentUrl);
    return target.origin === current.origin;
  } catch {
    return false;
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    title: "融易行",
    backgroundColor: "#f6f8fb",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isInternalNavigation(url, mainWindow.webContents.getURL())) {
      return { action: "allow" };
    }
    void shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isInternalNavigation(url, mainWindow.webContents.getURL())) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  void mainWindow.loadURL(getStartupUrl());
}

app.whenReady().then(() => {
  registerBundledWebProtocol();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (!isMac) app.quit();
});
