import { Navigate, createBrowserRouter } from "react-router-dom";

import { RequireAuth } from "@/app/layouts/RequireAuth";
import { RootLayout } from "@/app/layouts/RootLayout";
import { PasswordLoginPage } from "@/pages/login/PasswordLoginPage";
import { WebHomePage } from "@/pages/home/WebHomePage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
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
            element: <PlaceholderPage title="订单" description="订单列表页面将在后续阶段实现。" />,
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
