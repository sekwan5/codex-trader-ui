import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { LoadingBlock } from "../components/common/LoadingBlock";
import { AppLayout } from "./AppLayout";
import { TradingWorkspaceProvider } from "./TradingWorkspaceContext";

const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const OrdersPage = lazy(() => import("../pages/OrdersPage"));
const PerformancePage = lazy(() => import("../pages/PerformancePage"));
const RuntimePage = lazy(() => import("../pages/RuntimePage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const WatchlistPage = lazy(() => import("../pages/WatchlistPage"));

export default function App() {
  return (
    <TradingWorkspaceProvider>
      <Suspense
        fallback={
          <div className="app-shell">
            <LoadingBlock />
          </div>
        }
      >
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/entry-plans" element={<Navigate to="/watchlist" replace />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/trades" element={<Navigate to="/orders" replace />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="/runtime" element={<RuntimePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </TradingWorkspaceProvider>
  );
}
