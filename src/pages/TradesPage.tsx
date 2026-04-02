import { memo, useDeferredValue } from "react";

import { useTradingWorkspace } from "../app/TradingWorkspaceContext";
import { EmptyState } from "../components/common/EmptyState";
import { PageHeader } from "../components/common/PageHeader";
import { PaginationBar } from "../components/common/PaginationBar";
import { Panel } from "../components/common/Panel";
import { formatSignedWon, formatWon, metricTone, shortTime } from "../utils/formatters";

function TradesPageComponent() {
  const { cycles, setCyclePage, setTradePage, trades } = useTradingWorkspace();
  const deferredTrades = useDeferredValue(trades?.items ?? []);
  const deferredCycles = useDeferredValue(cycles?.items ?? []);

  return (
    <div className="page-stack">
      <PageHeader
        title="거래 기록"
        description="최근 체결 내역과 사이클 요약을 분리해서 빠르게 훑는 화면입니다."
      />

      <div className="page-grid-two">
        <Panel
          title="최근 매수·매도"
          subtitle="최신 거래부터 5건씩 확인"
          action={<PaginationBar pagination={trades?.pagination ?? null} onPageChange={setTradePage} />}
        >
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>시각</th>
                  <th>종목</th>
                  <th>구분</th>
                  <th>수량</th>
                  <th>체결가</th>
                  <th>손익</th>
                </tr>
              </thead>
              <tbody>
                {deferredTrades.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
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
                      <td>{item.shares.toLocaleString("ko-KR")}주</td>
                      <td>{formatWon(item.price)}</td>
                      <td className={metricTone(item.realized_pnl_amount)}>{formatSignedWon(item.realized_pnl_amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="사이클 기록"
          subtitle="루프 단위 요약과 체결 흐름"
          action={<PaginationBar pagination={cycles?.pagination ?? null} onPageChange={setCyclePage} />}
        >
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>시각</th>
                  <th>요약</th>
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
                      <td className="summary-cell">{item.summary || "요약 없음"}</td>
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
