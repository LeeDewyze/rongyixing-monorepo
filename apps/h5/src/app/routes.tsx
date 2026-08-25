import { lazy, type ComponentType } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";

import { RootLayout } from "@/app/layouts/RootLayout";
import { RequireAuth } from "@/app/layouts/RequireAuth";
import { TabLayout } from "@/app/layouts/TabLayout";
import { HomeTabPage } from "@/pages/home/HomeTabPage";
import { OrderListRedirect } from "@/app/routes/OrderListRedirect";
import { PasswordLoginPage } from "@/pages/PasswordLoginPage";
import { SplashPage } from "@/pages/SplashPage";
import { getRouterBasename } from "@/lib/base-path";

function lazyPage(loader: () => Promise<unknown>, exportName: string) {
  return lazy(async () => {
    const module = (await loader()) as Record<string, unknown>;
    const component = module[exportName];
    if (typeof component !== "function" && typeof component !== "object") {
      throw new Error(`Unable to load route component: ${exportName}`);
    }
    return { default: component as ComponentType<any> };
  });
}

const ForgotPasswordPage = lazyPage(
  () => import("@/pages/ForgotPasswordPage"),
  "ForgotPasswordPage",
);
const OrdersTabPage = lazyPage(() => import("@/pages/home/OrdersTabPage"), "OrdersTabPage");
const ProfileTabPage = lazyPage(() => import("@/pages/home/ProfileTabPage"), "ProfileTabPage");
const OrderHotelDetailPage = lazyPage(
  () => import("@/pages/order/OrderHotelDetailPage"),
  "OrderHotelDetailPage",
);
const OrderFlightDetailPage = lazyPage(
  () => import("@/pages/order/OrderFlightDetailPage"),
  "OrderFlightDetailPage",
);
const OrderTrainDetailPage = lazyPage(
  () => import("@/pages/order/OrderTrainDetailPage"),
  "OrderTrainDetailPage",
);
const OrderListPage = lazyPage(() => import("@/pages/order/OrderListPage"), "OrderListPage");
const HotelBookPage = lazyPage(() => import("@/pages/hotel/HotelBookPage"), "HotelBookPage");
const HotelDetailPage = lazyPage(() => import("@/pages/hotel/HotelDetailPage"), "HotelDetailPage");
const HotelListPage = lazyPage(() => import("@/pages/hotel/HotelListPage"), "HotelListPage");
const HotelKeywordSearchPage = lazyPage(
  () => import("@/pages/hotel/HotelKeywordSearchPage"),
  "HotelKeywordSearchPage",
);
const HotelMapPage = lazyPage(() => import("@/pages/hotel/HotelMapPage"), "HotelMapPage");
const HotelPayPage = lazyPage(() => import("@/pages/hotel/HotelPayPage"), "HotelPayPage");
const HotelResultPage = lazyPage(() => import("@/pages/hotel/HotelResultPage"), "HotelResultPage");
const HotelShowImagesPage = lazyPage(
  () => import("@/pages/hotel/HotelShowImagesPage"),
  "HotelShowImagesPage",
);
const HotelRoomDetailPage = lazyPage(
  () => import("@/pages/hotel/HotelRoomDetailPage"),
  "HotelRoomDetailPage",
);
const PassengerSelectPage = lazyPage(
  () => import("@/pages/passenger/PassengerSelectPage"),
  "PassengerSelectPage",
);
const PassengerCredentialPage = lazyPage(
  () => import("@/pages/passenger/PassengerCredentialPage"),
  "PassengerCredentialPage",
);
const ProfileCenterPage = lazyPage(
  () => import("@/pages/profile/ProfileCenterPage"),
  "ProfileCenterPage",
);
const TrainListPage = lazyPage(() => import("@/pages/train/TrainListPage"), "TrainListPage");
const TrainBookPage = lazyPage(() => import("@/pages/train/TrainBookPage"), "TrainBookPage");
const TrainPayPage = lazyPage(() => import("@/pages/train/TrainPayPage"), "TrainPayPage");
const TravelApplyPage = lazyPage(
  () => import("@/pages/travel/TravelApplyPage"),
  "TravelApplyPage",
);
const TravelApprovalPage = lazyPage(
  () => import("@/pages/travel/TravelApprovalPage"),
  "TravelApprovalPage",
);
const TravelTaskPage = lazyPage(() => import("@/pages/travel/TravelTaskPage"), "TravelTaskPage");
const CredentialListPage = lazyPage(
  () => import("@/pages/credential/CredentialListPage"),
  "CredentialListPage",
);
const AccountDeletionPage = lazyPage(
  () => import("@/pages/settings/AccountDeletionPage"),
  "AccountDeletionPage",
);
const AccountSecurityPage = lazyPage(
  () => import("@/pages/settings/AccountSecurityPage"),
  "AccountSecurityPage",
);
const AccountCardFormPage = lazyPage(
  () => import("@/pages/account-card/AccountCardFormPage"),
  "AccountCardFormPage",
);
const AccountCardListPage = lazyPage(
  () => import("@/pages/account-card/AccountCardListPage"),
  "AccountCardListPage",
);
const BindMobilePage = lazyPage(() => import("@/pages/settings/BindMobilePage"), "BindMobilePage");
const ChangePasswordPage = lazyPage(
  () => import("@/pages/settings/ChangePasswordPage"),
  "ChangePasswordPage",
);
const MessageNotificationPage = lazyPage(
  () => import("@/pages/settings/MessageNotificationPage"),
  "MessageNotificationPage",
);
const LoginDevicesPage = lazyPage(
  () => import("@/pages/settings/LoginDevicesPage"),
  "LoginDevicesPage",
);
const SettingsPage = lazyPage(() => import("@/pages/settings/SettingsPage"), "SettingsPage");
const ContactUsPage = lazyPage(() => import("@/pages/contact/ContactUsPage"), "ContactUsPage");
const NoticeListPage = lazyPage(() => import("@/pages/notice/NoticeListPage"), "NoticeListPage");
const NoticeDetailPage = lazyPage(
  () => import("@/pages/notice/NoticeDetailPage"),
  "NoticeDetailPage",
);
const OpenUrlPage = lazyPage(() => import("@/pages/open-url/OpenUrlPage"), "OpenUrlPage");
const DingTalkBindingPage = lazyPage(
  () => import("@/pages/settings/DingTalkBindingPage"),
  "DingTalkBindingPage",
);
const FlightCabinsPage = lazyPage(
  () => import("@/pages/flight/FlightCabinsPage"),
  "FlightCabinsPage",
);
const FlightBookPage = lazyPage(() => import("@/pages/flight/FlightBookPage"), "FlightBookPage");
const FlightListPage = lazyPage(() => import("@/pages/flight/FlightListPage"), "FlightListPage");
const FlightPayPage = lazyPage(() => import("@/pages/flight/FlightPayPage"), "FlightPayPage");
const FlightResultPage = lazyPage(
  () => import("@/pages/flight/FlightResultPage"),
  "FlightResultPage",
);
const FlightSelectCityPage = lazyPage(
  () => import("@/pages/flight/FlightSelectCityPage"),
  "FlightSelectCityPage",
);

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <SplashPage />,
    },
    {
      path: "/index.html",
      element: <Navigate to="/" replace />,
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
      path: "/login/forgot-password",
      element: <ForgotPasswordPage />,
    },
    {
      element: <RequireAuth />,
      children: [
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
            { index: true, element: <Navigate to="/home?product=flight" replace /> },
            { path: "list", element: <HotelListPage /> },
            { path: "keyword", element: <HotelKeywordSearchPage /> },
            { path: "map", element: <HotelMapPage /> },
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
            { path: "account-deletion", element: <AccountDeletionPage /> },
            { path: "mobile", element: <BindMobilePage /> },
            { path: "password", element: <ChangePasswordPage /> },
            { path: "devices", element: <LoginDevicesPage /> },
            { path: "notifications", element: <MessageNotificationPage /> },
            { path: "dingtalk", element: <DingTalkBindingPage /> },
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
          path: "/open-url",
          element: <RootLayout />,
          children: [{ index: true, element: <OpenUrlPage /> }],
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
      ],
    },
  ],
  {
    basename: getRouterBasename() || undefined,
  },
);
