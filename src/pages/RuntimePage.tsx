import { memo } from "react";

import { useTradingWorkspace } from "../app/TradingWorkspaceContext";
import { PageHeader } from "../components/common/PageHeader";
import { Panel } from "../components/common/Panel";
import { StatusPill } from "../components/common/StatusPill";

function RuntimePageComponent() {
  const { health, runtimePending, runtimeStatus, startRuntimeSafe, stopRuntimeSafe, summary } = useTradingWorkspace();

  return (
    <div className="page-stack">
      <PageHeader
        title="런타임"
        description="모의투자 안전 모드 실행 상태와 데이터 연결 상태를 분리해서 확인합니다."
      />

      <div className="page-grid-two runtime-page-grid">
        <Panel title="자동매매 런타임" subtitle="UI에서 켜고 끄는 안전 모드 제어">
          <div className="status-list">
            <div className="runtime-hero">
              <div>
                <span>자동매매 상태</span>
                <strong>{runtimeStatus?.running ? "실행 중" : "중지됨"}</strong>
                <small>{runtimeStatus?.mode === "paper_safe" ? "모의투자 안전 모드" : runtimeStatus?.mode || "-"}</small>
              </div>
              <div className="runtime-actions">
                <button className="secondary-button" onClick={() => void startRuntimeSafe()} disabled={runtimePending || runtimeStatus?.running}>
                  시작
                </button>
                <button className="danger-button" onClick={() => void stopRuntimeSafe()} disabled={runtimePending || !runtimeStatus?.running}>
                  중지
                </button>
              </div>
            </div>

            <div className="status-row">
              <span>루프 프로필</span>
              <strong>{summary?.loop_profile || "-"}</strong>
            </div>
            <div className="status-row">
              <span>런타임 역할</span>
              <strong>{summary?.runtime_role || "-"}</strong>
            </div>
            <div className="status-row">
              <span>판단 방식</span>
              <strong>{summary?.decision_source || "-"}</strong>
            </div>
            <div className="status-row">
              <span>프로세스 PID</span>
              <strong>{runtimeStatus?.pid ?? "-"}</strong>
            </div>
            <div className="status-row">
              <span>최근 시작 시각</span>
              <strong>{runtimeStatus?.started_at || "-"}</strong>
            </div>
            <div className="status-row">
              <span>로그 파일</span>
              <strong className="path-text">{runtimeStatus?.log_path || "-"}</strong>
            </div>
            {runtimeStatus?.last_error ? <div className="inline-error">{runtimeStatus.last_error}</div> : null}
          </div>
        </Panel>

        <Panel title="데이터 연결 상태" subtitle="백엔드와 DB 저장소 연결 상태">
          <div className="status-list">
            <div className="status-row">
              <span>DB 경로</span>
              <strong className="path-text">{health?.db_path || summary?.db_path || "-"}</strong>
            </div>
            <div className="status-grid">
              <StatusPill online={Boolean(health?.db_exists)} label="DB" />
              <StatusPill online={Boolean(health?.snapshot_exists)} label="스냅샷" />
              <StatusPill online={Boolean(health?.report_exists)} label="리포트" />
              <StatusPill online={Boolean(health?.runtime_settings_exists)} label="런타임 설정" />
              <StatusPill online={Boolean(health?.runtime_service_exists)} label="런타임 상태" />
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export default memo(RuntimePageComponent);
