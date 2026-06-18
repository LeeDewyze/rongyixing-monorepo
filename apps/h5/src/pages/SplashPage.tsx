import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import splashLogo from "@/assets/splash/logo.png";
import { designCqw, designHeightPercent } from "@/config/design";
import { SPLASH_SLOGAN } from "@/config/splash";

export function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate("/login", { replace: true });
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-dvh justify-center bg-white">
      <div
        className="relative w-full max-w-[375px] bg-white @container"
        style={{ height: "100dvh" }}
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
            fontSize: designCqw(SPLASH_SLOGAN.fontSize),
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
