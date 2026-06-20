import { createBrowserRouter } from "react-router-dom";

import { RootLayout } from "@/app/layouts/RootLayout";
import { FlightCabinsPage } from "@/pages/flight/FlightCabinsPage";
import { FlightListPage } from "@/pages/flight/FlightListPage";
import { FlightSearchPage } from "@/pages/flight/FlightSearchPage";
import { HomePage } from "@/pages/HomePage";
import { HotelBookPage } from "@/pages/hotel/HotelBookPage";
import { HotelDetailPage } from "@/pages/hotel/HotelDetailPage";
import { HotelListPage } from "@/pages/hotel/HotelListPage";
import { HotelPayPage } from "@/pages/hotel/HotelPayPage";
import { HotelResultPage } from "@/pages/hotel/HotelResultPage";
import { HotelSearchPage } from "@/pages/hotel/HotelSearchPage";
import { PassengerSelectPage } from "@/pages/passenger/PassengerSelectPage";
import { PasswordLoginPage } from "@/pages/PasswordLoginPage";
import { PhoneLoginPage } from "@/pages/PhoneLoginPage";
import { SplashPage } from "@/pages/SplashPage";
import { TrainListPage } from "@/pages/train/TrainListPage";
import { TrainSearchPage } from "@/pages/train/TrainSearchPage";

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
    children: [{ index: true, element: <HomePage /> }],
  },
  {
    path: "/hotel",
    element: <RootLayout />,
    children: [
      { index: true, element: <HotelSearchPage /> },
      { path: "list", element: <HotelListPage /> },
      { path: ":hotelId", element: <HotelDetailPage /> },
      { path: ":hotelId/book", element: <HotelBookPage /> },
      { path: "result/:orderId", element: <HotelResultPage /> },
      { path: "pay/:orderId", element: <HotelPayPage /> },
    ],
  },
  {
    path: "/passenger",
    element: <RootLayout />,
    children: [{ path: "select", element: <PassengerSelectPage /> }],
  },
  {
    path: "/flight",
    element: <RootLayout />,
    children: [
      { index: true, element: <FlightSearchPage /> },
      { path: "list", element: <FlightListPage /> },
      { path: ":flightId/cabins", element: <FlightCabinsPage /> },
    ],
  },
  {
    path: "/train",
    element: <RootLayout />,
    children: [
      { index: true, element: <TrainSearchPage /> },
      { path: "list", element: <TrainListPage /> },
    ],
  },
]);
