import { memo } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { useTradingWorkspace } from "./TradingWorkspaceContext";

const navigationItems = [
  { to: "/dashboard", label: "대시보드" },
  { to: "/watchlist", label: "주시 종목" },
  { to: "/orders", label: "주문 상태" },
  { to: "/performance", label: "일일 손익" },
  { to: "/runtime", label: "런타임" },
  { to: "/settings", label: "설정" },
];

function accountModeLabel(mode: string | undefined) {
  return mode === "live" ? "실계좌" : "모의투자";
}

function runtimeStateLabel(running: boolean | undefined) {
  return running ? "진행 중" : "대기 중";
}

function realtimeSyncLabel(streamConnected: boolean, networkOnline: boolean) {
  if (!networkOnline) return "오프라인";
  if (streamConnected) return "실시간 연결";
  return "폴링 모드";
}

function websocketStateLabel(status: string | undefined) {
  if (status === "connected") return "연결됨";
  if (status === "reconnecting") return "재접속 중";
  if (status === "paused") return "일시 중지";
  if (status === "disabled") return "중지됨";
  if (status === "disconnected") return "끊김";
  return "정보 없음";
}

function AppLayoutComponent() {
  const {
    autoRefreshEnabled,
    autoRefreshSeconds,
    error,
    lastLoadedAt,
    networkOnline,
    refreshing,
    refreshAll,
    runtimeStatus,
    setAutoRefreshEnabled,
    setAutoRefreshSeconds,
    streamConnected,
    websocketStatus,
  } = useTradingWorkspace();

  const accountMode = runtimeStatus?.settings?.account_mode === "live" ? "live" : "mock";
  const runtimeRunning = Boolean(runtimeStatus?.running);
  const hasError = Boolean(error);
  const headerErrorText = hasError ? error.replace(/\s+/g, " ").trim() : "";
  const runtimeStateTone = hasError
    ? "workspace-chip-error"
    : runtimeRunning
      ? "workspace-chip-running"
      : "workspace-chip-idle";
  const runtimeStateText = hasError ? "오류" : runtimeStateLabel(runtimeRunning);
  const syncStateText = realtimeSyncLabel(streamConnected, networkOnline);
  const websocketTone =
    websocketStatus?.status === "connected"
      ? "online"
      : websocketStatus?.status === "reconnecting"
        ? "connecting"
        : "offline";

  return (
    <div className="layout-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="eyebrow">Codex Trader</span>
          <strong>운영 콘솔</strong>
          <p>분리된 프론트와 백엔드 상태를 한 화면에서 빠르게 확인합니다.</p>
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
            <span className={`status-dot ${networkOnline ? (streamConnected ? "online" : "connecting") : "offline"}`}>
              {syncStateText}
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

          <div className="sidebar-meta">
            <span>웹소켓 상태</span>
            <strong className={`status-text ${websocketTone}`}>{websocketStateLabel(websocketStatus?.status)}</strong>
          </div>

          <button
            className="refresh-button sidebar-refresh"
            onClick={() => void refreshAll()}
            disabled={refreshing || !networkOnline}
          >
            {refreshing ? "갱신 중..." : "지금 새로고침"}
          </button>
        </div>
      </aside>

      <div className="content-shell">
        <header className="workspace-header workspace-header-compact">
          <div className={`workspace-chip workspace-chip-${accountMode}`} title={accountModeLabel(accountMode)}>
            <div className="workspace-chip-line">
              <span>계정</span>
              <strong>{accountModeLabel(accountMode)}</strong>
            </div>
          </div>
          <div className={`workspace-chip ${runtimeStateTone}`} title={headerErrorText || runtimeStateText}>
            <div className="workspace-chip-line">
              <span>상태</span>
              <strong>{runtimeStateText}</strong>
            </div>
          </div>
          <div className="workspace-chip workspace-chip-neutral" title={lastLoadedAt || "-"}>
            <div className="workspace-chip-line">
              <span>마지막 동기화</span>
              <strong>{lastLoadedAt || "-"}</strong>
            </div>
          </div>
        </header>

        {!networkOnline ? (
          <div className="banner offline">
            오프라인 상태입니다. 네트워크가 복구되면 자동 동기화가 다시 동작합니다.
          </div>
        ) : null}
        <Outlet />
      </div>
    </div>
  );
}

export const AppLayout = memo(AppLayoutComponent);
