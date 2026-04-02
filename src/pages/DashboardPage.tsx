import { memo, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useTradingWorkspace } from "../app/TradingWorkspaceContext";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingBlock } from "../components/common/LoadingBlock";
import { MetricCard } from "../components/common/MetricCard";
import { PageHeader } from "../components/common/PageHeader";
import { Panel } from "../components/common/Panel";
import {
  formatPct,
  formatSignedWon,
  formatWon,
  metricTone,
  profileLabel,
  shortTime,
  sleeveLabel,
} from "../utils/formatters";

function DashboardPageComponent() {
  const { equity, lastLoadedAt, loading, positions, runtimeStatus, summary } = useTradingWorkspace();

  const equityData = useMemo(
    () =>
      equity.items.map((item) => ({
        ...item,
        label: shortTime(item.timestamp),
      })),
    [equity.items],
  );

  const utilization = useMemo(() => {
    if (!summary || summary.portfolio_value <= 0) {
      return 0;
    }
    return ((summary.portfolio_value - summary.cash) / summary.portfolio_value) * 100;
  }, [summary]);

  return (
    <div className="page-stack">
      <PageHeader
        title="운영 대시보드"
        description="오늘 계좌 상태와 자산 흐름, 보유 종목 현황을 빠르게 읽는 화면입니다."
        action={
          <div className="header-status-card">
            <span>{runtimeStatus?.running ? "실행 중" : "대기 중"}</span>
            <strong>{lastLoadedAt || "아직 동기화 전"}</strong>
          </div>
        }
      />

      <section className="kpi-strip">
        {[
          {
            label: "총 평가자산",
            value: summary ? formatWon(summary.portfolio_value) : "-",
            detail: summary?.timestamp || "-",
          },
          {
            label: "보유 현금",
            value: summary ? formatWon(summary.cash) : "-",
            detail: summary ? `현금 비중 ${Math.max(0, 100 - utilization).toFixed(1)}%` : "-",
          },
          {
            label: "보유 종목",
            value: summary ? `${summary.position_count}개` : "-",
            detail: summary ? `감시 ${summary.watch_symbol_count}개` : "-",
          },
          {
            label: "오늘 매수",
            value: summary ? `${summary.buy_count}건` : "-",
            detail: "실행 기준",
          },
          {
            label: "오늘 매도",
            value: summary ? `${summary.sell_count}건` : "-",
            detail: "실행 기준",
          },
          {
            label: "일일 실현손익",
            value: summary ? formatSignedWon(summary.daily_realized_pnl) : "-",
            detail: summary ? `목표 ${formatWon(summary.daily_profit_target)}` : "-",
            tone: summary ? metricTone(summary.daily_realized_pnl) : "neutral",
          },
        ].map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            detail={metric.detail}
            tone={metric.tone}
          />
        ))}
      </section>

      <div className="dashboard-grid">
        <div className="primary-column">
          <Panel
            title="자산 흐름"
            subtitle="사이클 단위 총 평가자산 추이"
            action={
              <div className="inline-meta">
                <span>사이클 {summary?.cycle_count ?? 0}회</span>
                <span>판단 {summary?.decision_source || "-"}</span>
              </div>
            }
          >
            <div className="chart-wrap">
              {loading ? (
                <LoadingBlock />
              ) : equityData.length === 0 ? (
                <EmptyState message="아직 누적된 자산 흐름이 없습니다." />
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={equityData} margin={{ top: 10, right: 6, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="assetFlow" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.34} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e6ebf2" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#6b7684", fontSize: 12 }} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#6b7684", fontSize: 12 }}
                      tickFormatter={(value) => `${Math.round(value / 10000)}만`}
                    />
                    <Tooltip
                      formatter={(value: number) => formatWon(value)}
                      labelFormatter={(label) => `시각 ${label}`}
                      contentStyle={{
                        borderRadius: 16,
                        border: "1px solid #d8dee8",
                        boxShadow: "0 18px 50px rgba(15, 23, 42, 0.12)",
                      }}
                    />
                    <Area type="monotone" dataKey="portfolio_value" stroke="#2563eb" strokeWidth={2.5} fill="url(#assetFlow)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Panel>
        </div>

        <aside className="secondary-column">
          <Panel title="보유 종목" subtitle="현재 수량과 평가손익">
            <div className="stack-list">
              {positions.items.length === 0 ? (
                <EmptyState message="현재 보유 종목이 없습니다." />
              ) : (
                positions.items.map((item) => (
                  <article key={item.symbol} className="position-row">
                    <div className="position-top">
                      <div>
                        <strong>{item.name}</strong>
                        <span>{item.symbol}</span>
                      </div>
                      <div className={`position-pnl ${metricTone(item.unrealized_pnl)}`}>
                        <strong>{formatSignedWon(item.unrealized_pnl)}</strong>
                        <span>{formatPct(item.unrealized_pnl_pct)}</span>
                      </div>
                    </div>
                    <div className="position-bottom">
                      <span>{item.shares.toLocaleString("ko-KR")}주</span>
                      <span>평단 {formatWon(item.average_price)}</span>
                      <span>현재가 {formatWon(item.price)}</span>
                      <span>{profileLabel(item.strategy_profile)}</span>
                      <span>{sleeveLabel(item.capital_sleeve)}</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </Panel>

          <Panel title="오늘 흐름 요약" subtitle="운영자가 바로 보는 핵심 숫자">
            <div className="summary-stack">
              <div>
                <span>감시 종목</span>
                <strong>{summary?.watch_symbol_count ?? 0}개</strong>
              </div>
              <div>
                <span>긴급 감시</span>
                <strong>{summary?.watch_urgent_count ?? 0}개</strong>
              </div>
              <div>
                <span>새 기사 수</span>
                <strong>{summary?.news_item_count ?? 0}건</strong>
              </div>
              <div>
                <span>누적 거래</span>
                <strong>{summary?.trade_count ?? 0}건</strong>
              </div>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

export default memo(DashboardPageComponent);
