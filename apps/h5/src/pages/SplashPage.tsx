import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import splashLogo from "@/assets/splash/logo.png";
import { designHeightPercent, designMobileVw } from "@/config/design";
import { SPLASH_SLOGAN } from "@/config/splash";
import { isAuthenticated } from "@/lib/auth";
import { isNativeCapacitorRuntime } from "@/lib/runtime";

const SPLASH_DURATION_MS = 1500;

export function SplashPage() {
  const navigate = useNavigate();
  const isNativeRuntime = isNativeCapacitorRuntime();

  useEffect(() => {
    const target = isAuthenticated() ? "/home" : "/login/password";

    if (isNativeRuntime) {
      navigate(target, { replace: true });
      return;
    }

    const timer = window.setTimeout(() => {
      navigate(target, { replace: true });
    }, SPLASH_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [isNativeRuntime, navigate]);

  // Android already owns the branded launch screen. Avoid painting a second
  // H5 splash while the immediate route replacement is being applied.
  if (isNativeRuntime) return null;

  return (
    <div className="ryx-viewport-min flex justify-center bg-white">
      <div
        className="relative w-full max-w-[375px] bg-white @container"
        style={{ height: "var(--ryx-viewport-height, 100vh)" }}
      >
        <img
          src={splashLogo}
          alt="融易行 RONG TRIP"
          className="absolute left-1/2 top-[38%] w-[53.33%] max-w-[280px] -translate-x-1/2 -translate-y-1/2"
          width={512}
          height={141}
          decoding="async"
        />

        <p
          className="absolute left-1/2 m-0 w-full -translate-x-1/2 text-center font-normal leading-normal"
          style={{
            top: designHeightPercent(SPLASH_SLOGAN.top),
            fontSize: designMobileVw(SPLASH_SLOGAN.fontSize),
            color: SPLASH_SLOGAN.color,
            fontFamily: SPLASH_SLOGAN.fontFamily,
            letterSpacing: 0,
          }}
        >
          {SPLASH_SLOGAN.text}
        </p>
      </div>
    </div>
  );
}
