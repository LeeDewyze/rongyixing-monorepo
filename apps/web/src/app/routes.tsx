import { lazy, type ComponentType } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";

import { RequireAuth } from "@/app/layouts/RequireAuth";
import { RootLayout } from "@/app/layouts/RootLayout";
import { isAuthenticated } from "@/lib/auth";
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

const PasswordLoginPage = lazyPage(
  () => import("@/pages/login/PasswordLoginPage"),
  "PasswordLoginPage",
);
const ForgotPasswordPage = lazyPage(
  () => import("@/pages/login/ForgotPasswordPage"),
  "ForgotPasswordPage",
);
const WebHomePage = lazyPage(() => import("@/pages/home/WebHomePage"), "WebHomePage");
const NotFoundPage = lazyPage(() => import("@/pages/NotFoundPage"), "NotFoundPage");
const WebProfilePage = lazyPage(() => import("@/pages/profile/WebProfilePage"), "WebProfilePage");
const ProfileCenterPage = lazyPage(
  () => import("@/pages/profile/ProfileCenterPage"),
  "ProfileCenterPage",
);
const SettingsPage = lazyPage(() => import("@/pages/settings/SettingsPage"), "SettingsPage");
const AccountSecurityPage = lazyPage(
  () => import("@/pages/settings/AccountSecurityPage"),
  "AccountSecurityPage",
);
const AccountDeletionPage = lazyPage(
  () => import("@/pages/settings/AccountDeletionPage"),
  "AccountDeletionPage",
);
const BindMobilePage = lazyPage(() => import("@/pages/settings/BindMobilePage"), "BindMobilePage");
const ChangePasswordPage = lazyPage(
  () => import("@/pages/settings/ChangePasswordPage"),
  "ChangePasswordPage",
);
const LoginDevicesPage = lazyPage(
  () => import("@/pages/settings/LoginDevicesPage"),
  "LoginDevicesPage",
);
const MessageNotificationPage = lazyPage(
  () => import("@/pages/settings/MessageNotificationPage"),
  "MessageNotificationPage",
);
const ContactUsPage = lazyPage(() => import("@/pages/contact/ContactUsPage"), "ContactUsPage");
const NoticeListPage = lazyPage(() => import("@/pages/notice/NoticeListPage"), "NoticeListPage");
const NoticeDetailPage = lazyPage(
  () => import("@/pages/notice/NoticeDetailPage"),
  "NoticeDetailPage",
);
const AccountCardListPage = lazyPage(
  () => import("@/pages/account-card/AccountCardListPage"),
  "AccountCardListPage",
);
const AccountCardFormPage = lazyPage(
  () => import("@/pages/account-card/AccountCardFormPage"),
  "AccountCardFormPage",
);
const WebOrderListPage = lazyPage(
  () => import("@/pages/order/WebOrderListPage"),
  "WebOrderListPage",
);
const WebOrderFlightDetailPage = lazyPage(
  () => import("@/pages/order/WebOrderFlightDetailPage"),
  "WebOrderFlightDetailPage",
);
const WebOrderTrainDetailPage = lazyPage(
  () => import("@/pages/order/WebOrderTrainDetailPage"),
  "WebOrderTrainDetailPage",
);
const WebOrderHotelDetailPage = lazyPage(
  () => import("@/pages/order/WebOrderHotelDetailPage"),
  "WebOrderHotelDetailPage",
);
const WebOrderPayPage = lazyPage(() => import("@/pages/order/WebOrderPayPage"), "WebOrderPayPage");
const FlightListPage = lazyPage(() => import("@/pages/flight/FlightListPage"), "FlightListPage");
const FlightCabinsPage = lazyPage(
  () => import("@/pages/flight/FlightCabinsPage"),
  "FlightCabinsPage",
);
const FlightBookPage = lazyPage(() => import("@/pages/flight/FlightBookPage"), "FlightBookPage");
const FlightResultPage = lazyPage(
  () => import("@/pages/flight/FlightResultPage"),
  "FlightResultPage",
);
const FlightPayPage = lazyPage(() => import("@/pages/flight/FlightPayPage"), "FlightPayPage");
const FlightSelectCityPage = lazyPage(
  () => import("@/pages/flight/FlightSelectCityPage"),
  "FlightSelectCityPage",
);
const TrainListPage = lazyPage(() => import("@/pages/train/TrainListPage"), "TrainListPage");
const TrainBookPage = lazyPage(() => import("@/pages/train/TrainBookPage"), "TrainBookPage");
const TrainPayPage = lazyPage(() => import("@/pages/train/TrainPayPage"), "TrainPayPage");
const HotelListPage = lazyPage(() => import("@/pages/hotel/HotelListPage"), "HotelListPage");
const HotelKeywordSearchPage = lazyPage(
  () => import("@/pages/hotel/HotelKeywordSearchPage"),
  "HotelKeywordSearchPage",
);
const HotelDetailPage = lazyPage(() => import("@/pages/hotel/HotelDetailPage"), "HotelDetailPage");
const HotelShowImagesPage = lazyPage(
  () => import("@/pages/hotel/HotelShowImagesPage"),
  "HotelShowImagesPage",
);
const HotelRoomDetailPage = lazyPage(
  () => import("@/pages/hotel/HotelRoomDetailPage"),
  "HotelRoomDetailPage",
);
const HotelBookPage = lazyPage(() => import("@/pages/hotel/HotelBookPage"), "HotelBookPage");
const HotelResultPage = lazyPage(() => import("@/pages/hotel/HotelResultPage"), "HotelResultPage");
const HotelPayPage = lazyPage(() => import("@/pages/hotel/HotelPayPage"), "HotelPayPage");
const PassengerSelectPage = lazyPage(
  () => import("@/pages/passenger/PassengerSelectPage"),
  "PassengerSelectPage",
);
const PassengerCredentialPage = lazyPage(
  () => import("@/pages/passenger/PassengerCredentialPage"),
  "PassengerCredentialPage",
);
const CredentialListPage = lazyPage(
  () => import("@/pages/credential/CredentialListPage"),
  "CredentialListPage",
);
const OpenUrlPage = lazyPage(() => import("@/pages/open-url/OpenUrlPage"), "OpenUrlPage");
const TravelApplyPage = lazyPage(
  () => import("@/pages/travel/TravelApplyPage"),
  "TravelApplyPage",
);
const TravelApprovalPage = lazyPage(
  () => import("@/pages/travel/TravelApprovalPage"),
  "TravelApprovalPage",
);
const TravelTaskPage = lazyPage(() => import("@/pages/travel/TravelTaskPage"), "TravelTaskPage");
const DingTalkBindingPage = lazyPage(
  () => import("@/pages/settings/DingTalkBindingPage"),
  "DingTalkBindingPage",
);

function LoginEntryRedirect() {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return <Navigate to="/login/password" replace />;
}

export const router = createBrowserRouter(
  [
    {
      path: "/login",
      element: <LoginEntryRedirect />,
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
          path: "/",
          element: <RootLayout />,
          children: [
            { index: true, element: <WebHomePage /> },
            {
              path: "orders",
              children: [
                { index: true, element: <WebOrderListPage /> },
                { path: "flight/:orderId", element: <WebOrderFlightDetailPage /> },
                { path: "train/:orderId", element: <WebOrderTrainDetailPage /> },
                { path: "hotel/:orderId", element: <WebOrderHotelDetailPage /> },
                { path: "flight/:orderId/pay", element: <WebOrderPayPage productType="Flight" /> },
                { path: "train/:orderId/pay", element: <WebOrderPayPage productType="Train" /> },
                { path: "hotel/:orderId/pay", element: <WebOrderPayPage productType="Hotel" /> },
              ],
            },
            { path: "mine", element: <WebProfilePage /> },
            {
              path: "profile",
              children: [{ path: "center", element: <ProfileCenterPage /> }],
            },
            {
              path: "settings",
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
            { path: "me/settings", element: <Navigate to="/settings" replace /> },
            { path: "contact", element: <ContactUsPage /> },
            {
              path: "notice",
              children: [
                { index: true, element: <NoticeListPage /> },
                { path: ":noticeId", element: <NoticeDetailPage /> },
              ],
            },
            {
              path: "bank-cards",
              children: [
                { index: true, element: <AccountCardListPage /> },
                { path: "new", element: <AccountCardFormPage /> },
                { path: ":cardId", element: <AccountCardFormPage /> },
              ],
            },
            { path: "flight/select-city", element: <FlightSelectCityPage /> },
            {
              path: "flight",
              children: [
                { index: true, element: <Navigate to="/?product=flight" replace /> },
                { path: "list", element: <FlightListPage /> },
                { path: "book", element: <FlightBookPage /> },
                { path: "result/:orderId", element: <FlightResultPage /> },
                { path: "pay/:orderId", element: <FlightPayPage /> },
                { path: ":flightId/cabins", element: <FlightCabinsPage /> },
              ],
            },
            {
              path: "train",
              children: [
                { index: true, element: <Navigate to="/?product=train" replace /> },
                { path: "list", element: <TrainListPage /> },
                { path: "book", element: <TrainBookPage /> },
                { path: "pay/:orderId", element: <TrainPayPage /> },
              ],
            },
            {
              path: "hotel",
              children: [
                { index: true, element: <Navigate to="/?product=flight" replace /> },
                { path: "list", element: <HotelListPage /> },
                { path: "keyword", element: <HotelKeywordSearchPage /> },
                { path: ":hotelId/images", element: <HotelShowImagesPage /> },
                { path: ":hotelId/room/:roomId", element: <HotelRoomDetailPage /> },
                { path: ":hotelId/book", element: <HotelBookPage /> },
                { path: ":hotelId", element: <HotelDetailPage /> },
                { path: "result/:orderId", element: <HotelResultPage /> },
                { path: "pay/:orderId", element: <HotelPayPage /> },
              ],
            },
            {
              path: "passenger",
              children: [
                { path: "select", element: <PassengerSelectPage /> },
                { path: "credential", element: <PassengerCredentialPage /> },
              ],
            },
            { path: "credentials", element: <CredentialListPage /> },
            { path: "open-url", element: <OpenUrlPage /> },
            {
              path: "travel",
              children: [
                { path: "apply", element: <TravelApplyPage /> },
                { path: "approval", element: <TravelApprovalPage /> },
                { path: "workflow", element: <Navigate to="/travel/approval?tab=mine" replace /> },
                { path: "task", element: <TravelTaskPage /> },
              ],
            },
            { path: "*", element: <NotFoundPage /> },
          ],
        },
      ],
    },
    { path: "*", element: <NotFoundPage /> },
  ],
  {
    basename: getRouterBasename() || undefined,
  },
);
