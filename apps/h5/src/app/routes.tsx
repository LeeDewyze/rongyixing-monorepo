import { Navigate, createBrowserRouter } from "react-router-dom";

import { RootLayout } from "@/app/layouts/RootLayout";
import { TabLayout } from "@/app/layouts/TabLayout";
import { FlightCabinsPage } from "@/pages/flight/FlightCabinsPage";
import { FlightBookPage } from "@/pages/flight/FlightBookPage";
import { FlightListPage } from "@/pages/flight/FlightListPage";
import { FlightPayPage } from "@/pages/flight/FlightPayPage";
import { FlightResultPage } from "@/pages/flight/FlightResultPage";
import { FlightSelectCityPage } from "@/pages/flight/FlightSelectCityPage";
import { HomeTabPage } from "@/pages/home/HomeTabPage";
import { OrdersTabPage } from "@/pages/home/OrdersTabPage";
import { ProfileTabPage } from "@/pages/home/ProfileTabPage";
import { OrderHotelDetailPage } from "@/pages/order/OrderHotelDetailPage";
import { OrderFlightDetailPage } from "@/pages/order/OrderFlightDetailPage";
import { OrderTrainDetailPage } from "@/pages/order/OrderTrainDetailPage";
import { OrderListPage } from "@/pages/order/OrderListPage";
import { OrderListRedirect } from "@/app/routes/OrderListRedirect";
import { HotelBookPage } from "@/pages/hotel/HotelBookPage";
import { HotelDetailPage } from "@/pages/hotel/HotelDetailPage";
import { HotelListPage } from "@/pages/hotel/HotelListPage";
import { HotelPayPage } from "@/pages/hotel/HotelPayPage";
import { HotelResultPage } from "@/pages/hotel/HotelResultPage";
import { HotelShowImagesPage } from "@/pages/hotel/HotelShowImagesPage";
import { HotelRoomDetailPage } from "@/pages/hotel/HotelRoomDetailPage";
import { HotelSearchPage } from "@/pages/hotel/HotelSearchPage";
import { PassengerSelectPage } from "@/pages/passenger/PassengerSelectPage";
import { PassengerCredentialPage } from "@/pages/passenger/PassengerCredentialPage";
import { PasswordLoginPage } from "@/pages/PasswordLoginPage";
import { ProfileCenterPage } from "@/pages/profile/ProfileCenterPage";
import { SplashPage } from "@/pages/SplashPage";
import { TrainListPage } from "@/pages/train/TrainListPage";
import { TrainBookPage } from "@/pages/train/TrainBookPage";
import { TrainPayPage } from "@/pages/train/TrainPayPage";
import { TravelApplyPage } from "@/pages/travel/TravelApplyPage";
import { TravelApprovalPage } from "@/pages/travel/TravelApprovalPage";
import { TravelTaskPage } from "@/pages/travel/TravelTaskPage";
import { CredentialListPage } from "@/pages/credential/CredentialListPage";
import { AccountSecurityPage } from "@/pages/settings/AccountSecurityPage";
import { AccountCardFormPage } from "@/pages/account-card/AccountCardFormPage";
import { AccountCardListPage } from "@/pages/account-card/AccountCardListPage";
import { BindMobilePage } from "@/pages/settings/BindMobilePage";
import { ChangePasswordPage } from "@/pages/settings/ChangePasswordPage";
import { MessageNotificationPage } from "@/pages/settings/MessageNotificationPage";
import { LoginDevicesPage } from "@/pages/settings/LoginDevicesPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { ContactUsPage } from "@/pages/contact/ContactUsPage";
import { NoticeListPage } from "@/pages/notice/NoticeListPage";
import { NoticeDetailPage } from "@/pages/notice/NoticeDetailPage";

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
      { path: "flight/:orderId", element: <OrderFlightDetailPage /> },
      { path: "train/:orderId", element: <OrderTrainDetailPage /> },
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
      { path: ":hotelId/images", element: <HotelShowImagesPage /> },
      { path: ":hotelId", element: <HotelDetailPage /> },
      { path: ":hotelId/room/:roomId", element: <HotelRoomDetailPage /> },
      { path: ":hotelId/book", element: <HotelBookPage /> },
      { path: "result/:orderId", element: <HotelResultPage /> },
      { path: "pay/:orderId", element: <HotelPayPage /> },
    ],
  },
  {
    path: "/credentials",
    element: <RootLayout />,
    children: [{ index: true, element: <CredentialListPage /> }],
  },
  {
    path: "/bank-cards",
    element: <RootLayout />,
    children: [
      { index: true, element: <AccountCardListPage /> },
      { path: "new", element: <AccountCardFormPage /> },
      { path: ":cardId", element: <AccountCardFormPage /> },
    ],
  },
  {
    path: "/profile",
    element: <RootLayout />,
    children: [{ path: "center", element: <ProfileCenterPage /> }],
  },
  {
    path: "/settings",
    element: <RootLayout />,
    children: [
      { index: true, element: <SettingsPage /> },
      { path: "security", element: <AccountSecurityPage /> },
      { path: "mobile", element: <BindMobilePage /> },
      { path: "password", element: <ChangePasswordPage /> },
      { path: "devices", element: <LoginDevicesPage /> },
      { path: "notifications", element: <MessageNotificationPage /> },
    ],
  },
  {
    path: "/me/settings",
    element: <Navigate to="/settings" replace />,
  },
  {
    path: "/contact",
    element: <RootLayout />,
    children: [{ index: true, element: <ContactUsPage /> }],
  },
  {
    path: "/notice",
    element: <RootLayout />,
    children: [
      { index: true, element: <NoticeListPage /> },
      { path: ":noticeId", element: <NoticeDetailPage /> },
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
      { index: true, element: <Navigate to="/home?product=flight" replace /> },
      { path: "list", element: <FlightListPage /> },
      { path: "book", element: <FlightBookPage /> },
      { path: "result/:orderId", element: <FlightResultPage /> },
      { path: "pay/:orderId", element: <FlightPayPage /> },
      { path: ":flightId/cabins", element: <FlightCabinsPage /> },
    ],
  },
  {
    path: "/train",
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/home?product=train" replace /> },
      { path: "list", element: <TrainListPage /> },
      { path: "book", element: <TrainBookPage /> },
      { path: "pay/:orderId", element: <TrainPayPage /> },
    ],
  },
  {
    path: "/travel",
    element: <RootLayout />,
    children: [
      { path: "apply", element: <TravelApplyPage /> },
      { path: "approval", element: <TravelApprovalPage /> },
      { path: "workflow", element: <Navigate to="/travel/approval?tab=mine" replace /> },
      { path: "task", element: <TravelTaskPage /> },
    ],
  },
]);
