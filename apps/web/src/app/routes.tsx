import { Navigate, createBrowserRouter } from "react-router-dom";

import { RequireAuth } from "@/app/layouts/RequireAuth";
import { RootLayout } from "@/app/layouts/RootLayout";
import { PasswordLoginPage } from "@/pages/login/PasswordLoginPage";
import { WebHomePage } from "@/pages/home/WebHomePage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { WebOrderListPage } from "@/pages/order/WebOrderListPage";
import { WebOrderFlightDetailPage } from "@/pages/order/WebOrderFlightDetailPage";
import { WebOrderTrainDetailPage } from "@/pages/order/WebOrderTrainDetailPage";
import { WebOrderHotelDetailPage } from "@/pages/order/WebOrderHotelDetailPage";
import { WebOrderPayPage } from "@/pages/order/WebOrderPayPage";
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
          {
            index: true,
            element: <WebHomePage />,
          },
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
          {
            path: "mine",
            element: <PlaceholderPage title="我的" description="个人中心页面将在后续阶段实现。" />,
          },
        ],
      },
    ],
  },
]);
