import { AUTH_METHODS } from "@ryx/api";
import type { PayCreateResponse } from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import { getApiMode, getLegacyAppBaseUrl } from "@/lib/env";

interface WechatJsSdkConfig {
  appid: string;
  noncestr: string;
  signature: string;
  timestamp: string | number;
}

interface WechatSdk {
  config(options: {
    debug: boolean;
    appId: string;
    timestamp: string | number;
    nonceStr: string;
    signature: string;
    jsApiList: string[];
  }): void;
  ready(callback: () => void): void;
  error(callback: (error: unknown) => void): void;
  chooseWXPay(options: {
    timestamp: string | number;
    nonceStr: string;
    package: string;
    signType: string;
    paySign: string;
    success: () => void;
    cancel: () => void;
    fail: (error: unknown) => void;
  }): void;
}

declare global {
  interface Window {
    wx?: WechatSdk;
  }
}

const WECHAT_SDK_URL = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js";
let sdkPromise: Promise<WechatSdk> | null = null;
let readyPromise: Promise<WechatSdk> | null = null;

function loadWechatSdk(): Promise<WechatSdk> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("微信支付只能在浏览器中使用"));
  }
  if (window.wx) return Promise.resolve(window.wx);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<WechatSdk>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${WECHAT_SDK_URL}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => (window.wx ? resolve(window.wx) : reject(new Error("微信 JS SDK 未加载"))), {
        once: true,
      });
      existing.addEventListener("error", () => reject(new Error("微信 JS SDK 加载失败")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = WECHAT_SDK_URL;
    script.async = true;
    script.onload = () => (window.wx ? resolve(window.wx) : reject(new Error("微信 JS SDK 未加载")));
    script.onerror = () => reject(new Error("微信 JS SDK 加载失败"));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

async function getWechatJsSdkReady(): Promise<WechatSdk> {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    const wx = await loadWechatSdk();
    const pageUrl = window.location.href.split("#")[0];
    const encodedUrl = window.btoa(pageUrl);
    const appBaseUrl =
      getApiMode() === "proxy" ? window.location.origin : getLegacyAppBaseUrl();
    const config = await getApi().proxy.send<WechatJsSdkConfig>({
      method: AUTH_METHODS.WECHAT_JSSDK,
      url: `${appBaseUrl}/Home/WechatJsSdk`,
      data: { Url: encodedUrl },
      timeoutMs: 30_000,
    });
    return new Promise<WechatSdk>((resolve, reject) => {
      wx.config({
        debug: false,
        appId: config.appid,
        timestamp: config.timestamp,
        nonceStr: config.noncestr,
        signature: config.signature,
        jsApiList: ["chooseWXPay"],
      });
      wx.ready(() => resolve(wx));
      wx.error((error) => {
        readyPromise = null;
        reject(new Error(`微信 JS SDK 配置失败: ${JSON.stringify(error)}`));
      });
    });
  })();
  try {
    return await readyPromise;
  } catch (error) {
    readyPromise = null;
    throw error;
  }
}

export async function payWithWechatJsSdk(response: PayCreateResponse): Promise<void> {
  const timestamp = response.timeStamp;
  const nonceStr = response.nonceStr;
  const packageValue = response.package;
  const signType = response.signType;
  const paySign = response.paySign;
  if (timestamp == null || !nonceStr || !packageValue || !signType || !paySign) {
    throw new Error("微信支付参数不完整");
  }

  const wx = await getWechatJsSdkReady();
  await new Promise<void>((resolve, reject) => {
    wx.chooseWXPay({
      timestamp,
      nonceStr,
      package: packageValue,
      signType,
      paySign,
      success: resolve,
      cancel: () => reject(new Error("用户取消支付")),
      fail: (error) => reject(new Error(`微信支付失败: ${JSON.stringify(error)}`)),
    });
  });
}
