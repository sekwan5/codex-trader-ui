import { memo } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { useTradingWorkspace } from "./TradingWorkspaceContext";

const navigationItems = [
  { to: "/dashboard", label: "대시보드" },
  { to: "/trades", label: "거래 기록" },
  { to: "/runtime", label: "런타임" },
  { to: "/settings", label: "설정" },
];

function AppLayoutComponent() {
  const {
    autoRefreshEnabled,
    autoRefreshSeconds,
    error,
    health,
    lastLoadedAt,
    networkOnline,
    refreshing,
    refreshAll,
    runtimeStatus,
    setAutoRefreshEnabled,
    setAutoRefreshSeconds,
  } = useTradingWorkspace();

  return (
    <div className="layout-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="eyebrow">Codex Trader</span>
          <strong>운영 콘솔</strong>
          <p>분리된 프론트와 백엔드 상태를 한 화면에서 확인합니다.</p>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-status-card">
          <div className="sidebar-status-head">
            <strong>데이터 동기화</strong>
            <span className={`status-dot ${health?.status === "ok" && networkOnline ? "online" : "offline"}`}>
              {runtimeStatus?.running ? "런타임 실행 중" : "런타임 대기 중"}
            </span>
          </div>

          <label className="toggle-row">
            <span>자동 새로고침</span>
            <button
              type="button"
              className={`toggle-switch${autoRefreshEnabled ? " active" : ""}`}
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              aria-pressed={autoRefreshEnabled}
            >
              <span />
            </button>
          </label>

          <label className="select-row">
            <span>갱신 주기</span>
            <select
              value={autoRefreshSeconds}
              onChange={(event) => setAutoRefreshSeconds(Number.parseInt(event.target.value, 10))}
              disabled={!autoRefreshEnabled}
            >
              {[10, 20, 30, 60, 120].map((value) => (
                <option key={value} value={value}>
                  {value}초
                </option>
              ))}
            </select>
          </label>

          <div className="sidebar-meta">
            <span>마지막 동기화</span>
            <strong>{lastLoadedAt || "-"}</strong>
          </div>

          <div className="sidebar-meta">
            <span>네트워크 상태</span>
            <strong>{networkOnline ? "온라인" : "오프라인"}</strong>
          </div>

          <button className="refresh-button sidebar-refresh" onClick={() => void refreshAll()} disabled={refreshing || !networkOnline}>
            {refreshing ? "갱신 중..." : "지금 새로고침"}
          </button>
        </div>
      </aside>

      <div className="content-shell">
        {!networkOnline ? <div className="banner offline">오프라인 상태입니다. 네트워크가 복구되면 자동 새로고침이 다시 동작합니다.</div> : null}
        {error ? <div className="banner error">{error}</div> : null}
        <Outlet />
      </div>
    </div>
  );
}

export const AppLayout = memo(AppLayoutComponent);
