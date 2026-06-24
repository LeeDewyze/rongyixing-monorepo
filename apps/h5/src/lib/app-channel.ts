/** Legacy `AppService.getChannel()` — H5 defaults to 客户H5. */
export function resolveAppChannel(): string {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent.toLowerCase() : "";
  let channel = "H5";
  if (/micromessenger/.test(ua)) {
    channel = "WechatH5";
  } else if (/dingtalk/.test(ua)) {
    channel = "DingtalkH5";
  }
  return `客户${channel}`;
}
