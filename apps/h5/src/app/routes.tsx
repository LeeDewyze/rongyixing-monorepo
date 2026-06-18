import { createBrowserRouter } from "react-router-dom";

import { RootLayout } from "@/app/layouts/RootLayout";
import { HomePage } from "@/pages/HomePage";
import { PasswordLoginPage } from "@/pages/PasswordLoginPage";
import { PhoneLoginPage } from "@/pages/PhoneLoginPage";
import { SplashPage } from "@/pages/SplashPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <SplashPage />,
  },
  {
    path: "/login",
    element: <PhoneLoginPage />,
  },
  {
    path: "/login/password",
    element: <PasswordLoginPage />,
  },
  {
    path: "/home",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
    ],
  },
]);
