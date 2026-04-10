import { memo, useDeferredValue } from "react";

import { useTradingWorkspace } from "../app/TradingWorkspaceContext";
import { EmptyState } from "../components/common/EmptyState";
import { PageHeader } from "../components/common/PageHeader";
import { PaginationBar } from "../components/common/PaginationBar";
import { Panel } from "../components/common/Panel";
import { formatSignedWon, formatWon } from "../utils/formatters";

function PerformancePageComponent() {
  const { dailyPerformance, setPerformancePage } = useTradingWorkspace();
  const deferredRows = useDeferredValue(dailyPerformance?.items ?? []);
  const signedClassName = (value: number) => (value > 0 ? "signed-pnl positive" : value < 0 ? "signed-pnl negative" : "signed-pnl neutral");

  return (
    <div className="page-stack">
      <PageHeader
        title="일일 손익"
        description="날짜별 자산, 실현손익, 평가손익을 운영 기준으로 확인합니다."
      />

      <Panel
        title="일일 손익 기록"
        subtitle="날짜가 바뀌면 전날 손익이 확정되어 남습니다."
        action={<PaginationBar pagination={dailyPerformance?.pagination ?? null} onPageChange={setPerformancePage} />}
      >
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>거래일</th>
                <th>총자산</th>
                <th>현금</th>
                <th>계좌 일손익</th>
                <th>보유수</th>
              </tr>
            </thead>
            <tbody>
              {deferredRows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState compact message="일일 손익 기록이 아직 없습니다." />
                  </td>
                </tr>
              ) : (
                deferredRows.map((item) => (
                  <tr key={item.history_key}>
                    <td>{item.trading_date}</td>
                    <td>{formatWon(item.portfolio_value)}</td>
                    <td>{formatWon(item.cash)}</td>
                    <td className={signedClassName(item.account_daily_profit_loss)}>{formatSignedWon(item.account_daily_profit_loss)}</td>
                    <td>{item.position_count.toLocaleString("ko-KR")}개</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

export default memo(PerformancePageComponent);
