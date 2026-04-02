import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { LoadingBlock } from "../components/common/LoadingBlock";
import { AppLayout } from "./AppLayout";
import { TradingWorkspaceProvider } from "./TradingWorkspaceContext";

const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const TradesPage = lazy(() => import("../pages/TradesPage"));
const RuntimePage = lazy(() => import("../pages/RuntimePage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));

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
            <Route path="/trades" element={<TradesPage />} />
            <Route path="/runtime" element={<RuntimePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </TradingWorkspaceProvider>
  );
}
