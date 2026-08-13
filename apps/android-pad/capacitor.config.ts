import type { CapacitorConfig } from "@capacitor/cli";

const remoteUrl = process.env.RYX_PAD_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: process.env.RYX_ANDROID_APP_ID?.trim() || "com.ronglvonline.rongyixing.pad",
  appName: process.env.RYX_ANDROID_APP_NAME?.trim() || "融易行",
  webDir: "web-dist",
  bundledWebRuntime: false,
  server: remoteUrl
    ? {
        url: remoteUrl,
        cleartext: remoteUrl.startsWith("http://"),
      }
    : undefined,
  android: {
    path: "android",
    allowMixedContent: process.env.RYX_ANDROID_ALLOW_MIXED_CONTENT === "1",
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#ffffff",
    },
  },
};

export default config;
