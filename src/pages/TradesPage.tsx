import { memo, useDeferredValue } from "react";

import { useTradingWorkspace } from "../app/TradingWorkspaceContext";
import { EmptyState } from "../components/common/EmptyState";
import { PageHeader } from "../components/common/PageHeader";
import { PaginationBar } from "../components/common/PaginationBar";
import { Panel } from "../components/common/Panel";
import { formatSignedWon, formatWon, metricTone, shortTime } from "../utils/formatters";

function tradeStatusLabel(status: string): string {
  if (status === "executed") return "체결";
  if (status === "partial") return "부분체결";
  if (status === "submitted") return "주문접수";
  if (status === "expired") return "만료";
  if (status === "failed") return "실패";
  return status || "-";
}

function TradesPageComponent() {
  const { cycles, setCyclePage, setTradePage, trades } = useTradingWorkspace();
  const deferredTrades = useDeferredValue(trades?.items ?? []);
  const deferredCycles = useDeferredValue(cycles?.items ?? []);

  const renderRealizedPnl = (status: string, realizedPnlAmount: number) => {
    if (status !== "executed") {
      return <span className="muted-text">-</span>;
    }
    return <span className={metricTone(realizedPnlAmount)}>{formatSignedWon(realizedPnlAmount)}</span>;
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="거래 기록"
        description="최근 체결 내역과 사이클 요약을 분리해서 빠르게 훑는 화면입니다."
      />

      <div className="page-grid-two">
        <Panel
          title="최근 매수·매도"
          subtitle="주문접수와 체결 흐름을 최신순으로 확인"
          action={<PaginationBar pagination={trades?.pagination ?? null} onPageChange={setTradePage} />}
        >
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>시각</th>
                  <th>종목</th>
                  <th>구분</th>
                  <th>상태</th>
                  <th>수량</th>
                  <th>체결가</th>
                  <th>손익</th>
                </tr>
              </thead>
              <tbody>
                {deferredTrades.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState compact message="아직 거래 기록이 없습니다." />
                    </td>
                  </tr>
                ) : (
                  deferredTrades.map((item) => (
                    <tr key={item.history_key}>
                      <td>{shortTime(item.timestamp)}</td>
                      <td>
                        <div className="symbol-cell">
                          <strong>{item.name || item.symbol}</strong>
                          <span>{item.symbol}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`trade-badge ${item.action === "buy" ? "buy" : "sell"}`}>
                          {item.action === "buy" ? "매수" : "매도"}
                        </span>
                      </td>
                      <td>{tradeStatusLabel(item.status)}</td>
                      <td>{item.shares.toLocaleString("ko-KR")}주</td>
                      <td>{formatWon(item.price)}</td>
                      <td>{renderRealizedPnl(item.status, item.realized_pnl_amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="사이클 기록"
          subtitle="누가 사이클을 돌렸는지와 결과만 확인"
          action={<PaginationBar pagination={cycles?.pagination ?? null} onPageChange={setCyclePage} />}
        >
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>시각</th>
                  <th>주체</th>
                  <th>매수</th>
                  <th>매도</th>
                  <th>총자산</th>
                </tr>
              </thead>
              <tbody>
                {deferredCycles.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState compact message="아직 사이클 기록이 없습니다." />
                    </td>
                  </tr>
                ) : (
                  deferredCycles.map((item) => (
                    <tr key={item.cycle_key}>
                      <td>{shortTime(item.timestamp)}</td>
                      <td>{item.actor || "시스템"}</td>
                      <td>{item.buy_count}건</td>
                      <td>{item.sell_count}건</td>
                      <td>{formatWon(item.portfolio_value)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export default memo(TradesPageComponent);
