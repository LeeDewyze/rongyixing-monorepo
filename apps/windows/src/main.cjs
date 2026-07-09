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
  protocol.handle("ryx", (request) => {
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

