import { createBrowserRouter } from "react-router-dom";

import { RootLayout } from "@/app/layouts/RootLayout";
import { HomePage } from "@/pages/HomePage";
import { HotelBookPage } from "@/pages/hotel/HotelBookPage";
import { HotelDetailPage } from "@/pages/hotel/HotelDetailPage";
import { HotelListPage } from "@/pages/hotel/HotelListPage";
import { HotelPayPage } from "@/pages/hotel/HotelPayPage";
import { HotelResultPage } from "@/pages/hotel/HotelResultPage";
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
      { index: true, element: <HomePage /> },
      { path: "hotel", element: <HotelListPage /> },
    ],
  },
  {
    path: "/hotel",
    element: <RootLayout />,
    children: [
      { index: true, element: <HotelListPage /> },
      { path: ":hotelId", element: <HotelDetailPage /> },
      { path: ":hotelId/book", element: <HotelBookPage /> },
      { path: "result/:orderId", element: <HotelResultPage /> },
      { path: "pay/:orderId", element: <HotelPayPage /> },
    ],
  },
]);
