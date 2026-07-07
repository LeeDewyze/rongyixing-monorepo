import { Navigate, createBrowserRouter } from "react-router-dom";

import { RequireAuth } from "@/app/layouts/RequireAuth";
import { RootLayout } from "@/app/layouts/RootLayout";
import { PasswordLoginPage } from "@/pages/login/PasswordLoginPage";
import { WebHomePage } from "@/pages/home/WebHomePage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { WebOrderListPage } from "@/pages/order/WebOrderListPage";
import { WebOrderFlightDetailPage } from "@/pages/order/WebOrderFlightDetailPage";
import { WebOrderTrainDetailPage } from "@/pages/order/WebOrderTrainDetailPage";
import { WebOrderHotelDetailPage } from "@/pages/order/WebOrderHotelDetailPage";
import { WebOrderPayPage } from "@/pages/order/WebOrderPayPage";
import { FlightListPage } from "@/pages/flight/FlightListPage";
import { FlightCabinsPage } from "@/pages/flight/FlightCabinsPage";
import { FlightBookPage } from "@/pages/flight/FlightBookPage";
import { FlightResultPage } from "@/pages/flight/FlightResultPage";
import { FlightPayPage } from "@/pages/flight/FlightPayPage";
import { FlightSelectCityPage } from "@/pages/flight/FlightSelectCityPage";
import { TrainListPage } from "@/pages/train/TrainListPage";
import { TrainBookPage } from "@/pages/train/TrainBookPage";
import { TrainPayPage } from "@/pages/train/TrainPayPage";
import { HotelListPage } from "@/pages/hotel/HotelListPage";
import { HotelKeywordSearchPage } from "@/pages/hotel/HotelKeywordSearchPage";
import { HotelDetailPage } from "@/pages/hotel/HotelDetailPage";
import { HotelShowImagesPage } from "@/pages/hotel/HotelShowImagesPage";
import { HotelRoomDetailPage } from "@/pages/hotel/HotelRoomDetailPage";
import { HotelBookPage } from "@/pages/hotel/HotelBookPage";
import { HotelResultPage } from "@/pages/hotel/HotelResultPage";
import { HotelPayPage } from "@/pages/hotel/HotelPayPage";
import { HotelSearchPage } from "@/pages/hotel/HotelSearchPage";
import { PassengerSelectPage } from "@/pages/passenger/PassengerSelectPage";
import { PassengerCredentialPage } from "@/pages/passenger/PassengerCredentialPage";
import { CredentialListPage } from "@/pages/credential/CredentialListPage";
import { isAuthenticated } from "@/lib/auth";

function LoginEntryRedirect() {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return <Navigate to="/login/password" replace />;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginEntryRedirect />,
  },
  {
    path: "/login/password",
    element: <PasswordLoginPage />,
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
          { path: "mine", element: <PlaceholderPage title="我的" description="个人中心页面将在后续阶段实现。" /> },
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
              { index: true, element: <HotelSearchPage /> },
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
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
