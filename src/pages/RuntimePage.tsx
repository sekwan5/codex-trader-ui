import { memo } from "react";

import { useTradingWorkspace } from "../app/TradingWorkspaceContext";
import { EmptyState } from "../components/common/EmptyState";
import { PageHeader } from "../components/common/PageHeader";
import { Panel } from "../components/common/Panel";
import { StatusPill } from "../components/common/StatusPill";

function runtimeModeLabel(mode: string | undefined) {
  if (mode === "kis_mock") return "KIS 모의투자";
  if (mode === "kis_live") return "KIS 실계좌";
  return mode || "-";
}

function loopProfileLabel(profile: string | undefined) {
  if (profile === "scalp_fast") return "단타 빠른 루프";
  if (profile === "swing") return "스윙";
  if (profile === "default") return "기본";
  return profile || "-";
}

function runtimeRoleLabel(role: string | undefined) {
  if (role === "unified") return "통합 실행";
  if (role === "watchlist") return "주시종목 전용";
  if (role === "websocket") return "웹소켓 전용";
  if (role === "trading") return "매매 전용";
  return role || "-";
}

function decisionSourceLabel(source: string | undefined) {
  if (source === "codex") return "AI 판단";
  if (source === "auto") return "자동 판단";
  if (source === "sample") return "샘플 판단";
  if (source === "plan_reuse") return "이전 플랜 재사용";
  if (source === "planning_only") return "플랜 생성 전용";
  if (source === "websocket_entry_monitor") return "실시간 진입 감시";
  if (source === "websocket_exit_monitor") return "실시간 청산 감시";
  if (source === "startup_recovery") return "시작 복구";
  if (source === "idle") return "대기";
  return source || "-";
}

function websocketStateLabel(status: string | undefined) {
  if (status === "connected") return "연결됨";
  if (status === "reconnecting") return "재접속 중";
  if (status === "paused") return "일시 중지";
  if (status === "disabled") return "중지됨";
  if (status === "disconnected") return "끊김";
  return "정보 없음";
}

function aiDecisionStateLabel(state: string | undefined) {
  if (state === "running") return "AI 판단 중";
  if (state === "completed") return "AI 판단 완료";
  if (state === "cached") return "이전 판단 재사용";
  if (state === "failed") return "AI 판단 실패";
  return "AI 상태 없음";
}

function aiDecisionStateClassName(state: string | undefined) {
  if (state === "completed" || state === "cached") return "positive";
  if (state === "failed") return "negative";
  return "neutral";
}

function RuntimePageComponent() {
  const { runtimePending, runtimeStatus, startRuntimeSafe, stopRuntimeSafe, summary, websocketStatus } =
    useTradingWorkspace();
  const preflight = runtimeStatus?.last_preflight;
  const runtimeRunning = Boolean(runtimeStatus?.running);
  const toggleLabel = runtimePending ? "처리 중..." : runtimeRunning ? "중지" : "시작";
  const toggleClassName = runtimeRunning ? "danger-button" : "secondary-button";
  const aiDecisionStatus = summary?.ai_decision_status;

  const handleRuntimeToggle = () => {
    if (runtimePending) return;
    if (runtimeRunning) {
      void stopRuntimeSafe();
      return;
    }
    void startRuntimeSafe();
  };

  return (
    <div className="page-stack">
      <PageHeader title="런타임" description="자동매매 실행 상태와 시작 점검, 웹소켓 연결 상태를 확인합니다." />

      <div className="page-grid-two runtime-page-grid">
        <Panel title="자동매매 실행" subtitle="현재 설정과 계정 모드로 런타임을 시작하거나 중지합니다.">
          <div className="status-list">
            <div className="runtime-hero">
              <div>
                <span>자동매매 상태</span>
                <strong>{runtimeRunning ? "실행 중" : "중지됨"}</strong>
                <small>{runtimeModeLabel(runtimeStatus?.mode)}</small>
              </div>
              <div className="runtime-actions">
                <button className={toggleClassName} onClick={handleRuntimeToggle} disabled={runtimePending}>
                  {toggleLabel}
                </button>
              </div>
            </div>

            <div className="status-row">
              <span>계정 모드</span>
              <strong>{runtimeStatus?.settings?.account_mode === "live" ? "KIS 실계좌" : "KIS 모의투자"}</strong>
            </div>
            <div className="status-row">
              <span>루프 프로필</span>
              <strong>{loopProfileLabel(summary?.loop_profile)}</strong>
            </div>
            <div className="status-row">
              <span>런타임 역할</span>
              <strong>{runtimeRoleLabel(summary?.runtime_role)}</strong>
            </div>
            <div className="status-row">
              <span>판단 방식</span>
              <strong>{decisionSourceLabel(summary?.decision_source)}</strong>
            </div>
            <div className="status-row">
              <span>AI 판단 상태</span>
              <strong className={aiDecisionStateClassName(aiDecisionStatus?.state)}>
                {aiDecisionStateLabel(aiDecisionStatus?.state)}
              </strong>
            </div>
            <div className="status-row">
              <span>AI 후보 수</span>
              <strong>{aiDecisionStatus?.prompt_symbol_count ?? 0}개</strong>
            </div>
            <div className="status-row">
              <span>프로세스 PID</span>
              <strong>{runtimeStatus?.pid ?? "-"}</strong>
            </div>
            <div className="status-row">
              <span>최근 시작 시각</span>
              <strong>{runtimeStatus?.started_at || "-"}</strong>
            </div>
          </div>
        </Panel>

        <Panel title="시작 전 점검" subtitle="실행 전 계정과 KIS 연결 상태를 확인한 결과입니다.">
          {!preflight || !preflight.checks?.length ? (
            <EmptyState compact message="아직 시작 전 점검 기록이 없습니다." />
          ) : (
            <div className="status-list">
              <div className="status-row">
                <span>최근 점검 시각</span>
                <strong>{preflight.checked_at || "-"}</strong>
              </div>
              <div className="status-grid">
                {preflight.checks.map((item) => (
                  <StatusPill key={item.key} online={item.ok} label={item.label} />
                ))}
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>항목</th>
                      <th>결과</th>
                      <th>메시지</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preflight.checks.map((item) => (
                      <tr key={`${item.key}-detail`}>
                        <td>{item.label}</td>
                        <td>{item.ok ? "통과" : "실패"}</td>
                        <td>{item.message || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Panel>

        <Panel title="웹소켓 상태" subtitle="실시간 감시 연결과 구독 상태를 확인합니다.">
          <div className="status-list">
            <div className="status-row">
              <span>연결 상태</span>
              <strong>{websocketStateLabel(websocketStatus?.status)}</strong>
            </div>
            <div className="status-row">
              <span>구독 종목 수</span>
              <strong>{websocketStatus?.subscription_count ?? 0}개</strong>
            </div>
            <div className="status-row">
              <span>활성 종목 수</span>
              <strong>{websocketStatus?.active_symbols?.length ?? 0}개</strong>
            </div>
            <div className="status-row">
              <span>마지막 수신</span>
              <strong>{websocketStatus?.last_message_at || "-"}</strong>
            </div>
            <div className="status-row">
              <span>최근 오류</span>
              <strong className="path-text">{websocketStatus?.last_error || "-"}</strong>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export default memo(RuntimePageComponent);
