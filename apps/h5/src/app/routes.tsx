import { Navigate, createBrowserRouter } from "react-router-dom";

import { RootLayout } from "@/app/layouts/RootLayout";
import { TabLayout } from "@/app/layouts/TabLayout";
import { FlightCabinsPage } from "@/pages/flight/FlightCabinsPage";
import { FlightListPage } from "@/pages/flight/FlightListPage";
import { FlightSearchPage } from "@/pages/flight/FlightSearchPage";
import { FlightSelectCityPage } from "@/pages/flight/FlightSelectCityPage";
import { HomeTabPage } from "@/pages/home/HomeTabPage";
import { OrdersTabPage } from "@/pages/home/OrdersTabPage";
import { ProfileTabPage } from "@/pages/home/ProfileTabPage";
import { OrderHotelDetailPage } from "@/pages/order/OrderHotelDetailPage";
import { OrderListPage } from "@/pages/order/OrderListPage";
import { OrderListRedirect } from "@/app/routes/OrderListRedirect";
import { HotelBookPage } from "@/pages/hotel/HotelBookPage";
import { HotelDetailPage } from "@/pages/hotel/HotelDetailPage";
import { HotelListPage } from "@/pages/hotel/HotelListPage";
import { HotelPayPage } from "@/pages/hotel/HotelPayPage";
import { HotelResultPage } from "@/pages/hotel/HotelResultPage";
import { HotelSearchPage } from "@/pages/hotel/HotelSearchPage";
import { PassengerSelectPage } from "@/pages/passenger/PassengerSelectPage";
import { PassengerCredentialPage } from "@/pages/passenger/PassengerCredentialPage";
import { PasswordLoginPage } from "@/pages/PasswordLoginPage";
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
      { path: "orders", element: <OrdersTabPage /> },
      {
        path: "trips",
        element: <OrderListRedirect to="/home/orders" />,
      },
      { path: "mine", element: <ProfileTabPage /> },
    ],
  },
  {
    path: "/trips",
    element: <OrderListRedirect to="/home/orders" />,
  },
  {
    path: "/orders",
    element: <RootLayout />,
    children: [
      { index: true, element: <OrderListPage /> },
      { path: "hotel/:orderId", element: <OrderHotelDetailPage /> },
    ],
  },
  {
    path: "/flight/select-city",
    element: <FlightSelectCityPage />,
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
    children: [
      { path: "select", element: <PassengerSelectPage /> },
      { path: "credential", element: <PassengerCredentialPage /> },
    ],
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
