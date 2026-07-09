const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("RongYiXingDesktop", {
  platform: process.platform,
});

