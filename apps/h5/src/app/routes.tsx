import { Navigate, createBrowserRouter } from "react-router-dom";

import { RootLayout } from "@/app/layouts/RootLayout";
import { TabLayout } from "@/app/layouts/TabLayout";
import { HomeTabPage } from "@/pages/home/HomeTabPage";
import { ProfileTabPage } from "@/pages/home/ProfileTabPage";
import { TripsTabPage } from "@/pages/home/TripsTabPage";
import { HotelBookPage } from "@/pages/hotel/HotelBookPage";
import { HotelDetailPage } from "@/pages/hotel/HotelDetailPage";
import { HotelListPage } from "@/pages/hotel/HotelListPage";
import { HotelPayPage } from "@/pages/hotel/HotelPayPage";
import { HotelResultPage } from "@/pages/hotel/HotelResultPage";
import { PasswordLoginPage } from "@/pages/PasswordLoginPage";
import { SplashPage } from "@/pages/SplashPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <SplashPage />,
  },
  {
    path: "/login",
    element: <Navigate to="/login/password" replace />,
  },
  {
    path: "/login/password",
    element: <PasswordLoginPage />,
  },
  {
    path: "/home",
    element: <TabLayout />,
    children: [
      { index: true, element: <HomeTabPage /> },
      { path: "trips", element: <TripsTabPage /> },
      { path: "mine", element: <ProfileTabPage /> },
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
