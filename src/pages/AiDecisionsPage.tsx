import { memo, useEffect, useState } from "react";

import { fetchAiDecisions } from "../api";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingBlock } from "../components/common/LoadingBlock";
import { PageHeader } from "../components/common/PageHeader";
import { Panel } from "../components/common/Panel";
import type { AiDecisionHistoryItem, AiDecisionPageResponse } from "../types";

type HistoryEventRow = {
  key: string;
  label: string;
  time: string;
};

function stateLabel(state: string | undefined) {
  if (state === "running") return "실행 중";
  if (state === "completed") return "완료";
  if (state === "failed") return "실패";
  if (state === "cached") return "캐시";
  return state || "-";
}

function buildHistoryEvents(items: AiDecisionHistoryItem[]): HistoryEventRow[] {
  return items
    .flatMap((item) => {
      const keyBase = `${item.timestamp}-${String(item.summary || "").slice(0, 20)}`;
      const rows: HistoryEventRow[] = [];
      if (item.ai_started_at) {
        rows.push({ key: `${keyBase}-start`, label: "시작", time: item.ai_started_at });
      }
      if (item.ai_completed_at) {
        rows.push({ key: `${keyBase}-end`, label: "종료", time: item.ai_completed_at });
      }
      return rows;
    })
    .sort((left, right) => right.time.localeCompare(left.time));
}

function AiDecisionsPageComponent() {
  const [data, setData] = useState<AiDecisionPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const next = await fetchAiDecisions(20);
        if (!active) return;
        setData(next);
      } catch (nextError) {
        if (!active) return;
        setError(nextError instanceof Error ? nextError.message : "AI 판단 이력을 불러오지 못했습니다.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const current = data?.current;
  const visibleHistory = (data?.history ?? []).filter((item) => item.ai_started_at || item.ai_completed_at);
  const historyEvents = buildHistoryEvents(visibleHistory);

  return (
    <div className="page-stack">
      <PageHeader
        title="AI 판단 이력"
        description="AI 판단의 현재 상태와 최근 시작·종료 시각을 확인합니다."
      />

      <div className="page-grid-two runtime-page-grid">
        <Panel title="현재 실행 상태" subtitle="지금 어떤 후보를 보고 있는지와 마지막 완료 상태를 확인합니다.">
          {loading ? (
            <LoadingBlock />
          ) : !current ? (
            <EmptyState message="AI 판단 상태가 아직 없습니다." />
          ) : (
            <div className="status-list">
              <div className="status-row">
                <span>상태</span>
                <strong>{stateLabel(current.state)}</strong>
              </div>
              <div className="status-row">
                <span>시작 시각</span>
                <strong>{current.started_at || "-"}</strong>
              </div>
              <div className="status-row">
                <span>마지막 완료</span>
                <strong>{current.last_completed_at || "-"}</strong>
              </div>
              <div className="status-row">
                <span>판단 소스</span>
                <strong>{current.decision_source || "-"}</strong>
              </div>
              <div className="status-row">
                <span>후보 수</span>
                <strong>{current.prompt_symbol_count}개</strong>
              </div>
              <div className="status-row">
                <span>런타임</span>
                <strong>{current.runtime_running ? "실행 중" : "중지"}</strong>
              </div>
              <div className="status-row">
                <span>최신 스냅샷</span>
                <strong>{data?.snapshot_timestamp || "-"}</strong>
              </div>
              <div className="status-row">
                <span>현재 요약</span>
                <strong className="path-text">{current.current_summary || "-"}</strong>
              </div>
              <div className="status-row">
                <span>마지막 결과</span>
                <strong className="path-text">{current.result_summary || "-"}</strong>
              </div>
              {current.runtime_error ? (
                <div className="status-row">
                  <span>런타임 에러</span>
                  <strong className="path-text">{current.runtime_error}</strong>
                </div>
              ) : null}
            </div>
          )}
        </Panel>

        <Panel title="최근 판단 기록" subtitle="최신 시각이 위로 오도록 시작/종료 이벤트를 보여줍니다.">
          {loading ? (
            <LoadingBlock />
          ) : error ? (
            <EmptyState message={error} />
          ) : !historyEvents.length ? (
            <EmptyState message="최근 AI 판단 기록이 없습니다." />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>구분</th>
                    <th>시각</th>
                  </tr>
                </thead>
                <tbody>
                  {historyEvents.map((item) => (
                    <tr key={item.key}>
                      <td>{item.label}</td>
                      <td>{item.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

export default memo(AiDecisionsPageComponent);
