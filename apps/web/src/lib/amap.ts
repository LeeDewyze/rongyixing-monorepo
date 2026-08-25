type AMapWindow = Window & {
  AMap?: any;
  _AMapSecurityConfig?: {
    securityJsCode?: string;
  };
  __ryxAmapInit__?: () => void;
};

const AMAP_KEY = "69bcc41d415339e413b2e967040b6726";
const AMAP_SECURITY_JS_CODE = "46721a0ab9503fa97657ec4cb2a79a8a";

let amapPromise: Promise<any> | null = null;

export function loadAmap(): Promise<any> {
  const root = window as AMapWindow;
  if (root.AMap) {
    return Promise.resolve(root.AMap);
  }
  if (amapPromise) {
    return amapPromise;
  }

  amapPromise = new Promise<any>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("#ryx-amap-script");
    if (existing && root.AMap) {
      resolve(root.AMap);
      return;
    }

    root._AMapSecurityConfig = {
      securityJsCode: AMAP_SECURITY_JS_CODE,
    };

    const cleanup = () => {
      if (root.__ryxAmapInit__) {
        delete root.__ryxAmapInit__;
      }
    };

    root.__ryxAmapInit__ = () => {
      cleanup();
      if (root.AMap) {
        resolve(root.AMap);
      } else {
        reject(new Error("AMap 未初始化"));
      }
    };

    if (!existing) {
      const script = document.createElement("script");
      script.id = "ryx-amap-script";
      script.type = "text/javascript";
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}&callback=__ryxAmapInit__`;
      script.onerror = () => {
        cleanup();
        reject(new Error("AMap 加载失败"));
      };
      document.body.appendChild(script);
    }
  });

  return amapPromise;
}
