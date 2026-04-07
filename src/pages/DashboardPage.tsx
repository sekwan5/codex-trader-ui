import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
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
  formatCompactWon,
  formatPct,
  formatSignedWon,
  formatWon,
  metricTone,
  profileLabel,
  sleeveLabel,
} from "../utils/formatters";

function planStatusLabel(status: string): string {
  if (status === "armed") return "진입 대기";
  if (status === "standby") return "감시 대기";
  if (status === "invalidated") return "무효화";
  if (status === "expired") return "만료";
  return status || "-";
}

function watchlistTierLabel(tier: string): string {
  if (tier === "leader") return "핵심";
  if (tier === "dynamic") return "추적";
  return "일반";
}

function DashboardPageComponent() {
  const { equity, entryPlans, loading, positions, summary, watchlist, websocketStatus } = useTradingWorkspace();

  const activeEntryPlans = useMemo(
    () => (entryPlans?.items ?? []).filter((plan) => plan.plan_status === "armed" || plan.plan_status === "standby"),
    [entryPlans?.items],
  );

  const equityData = useMemo(() => {
    const byDate = new Map<string, (typeof equity.items)[number]>();
    for (const item of equity.items) {
      const timestamp = String(item.timestamp || "");
      const dateKey = timestamp.slice(0, 10);
      if (!dateKey) continue;
      const previous = byDate.get(dateKey);
      if (!previous || String(previous.timestamp || "") <= timestamp) {
        byDate.set(dateKey, item);
      }
    }
    return Array.from(byDate.entries())
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([dateKey, item]) => ({
        ...item,
        label: dateKey.slice(5).replace("-", "."),
      }));
  }, [equity.items]);

  const utilization = useMemo(() => {
    if (!summary || summary.portfolio_value <= 0) return 0;
    return ((summary.portfolio_value - summary.cash) / summary.portfolio_value) * 100;
  }, [summary]);

  const entryPlanPreview = activeEntryPlans.slice(0, 3);
  const watchlistPreview = watchlist?.items.slice(0, 3) ?? [];

  return (
    <div className="page-stack">
      <PageHeader
        title="운영 대시보드"
        description="자산 흐름과 현재 감시 중인 플랜, 보유 종목 상태를 빠르게 확인합니다."
      />

      <section className="kpi-strip kpi-strip-five">
        <MetricCard
          label="총 평가자산"
          value={summary ? formatWon(summary.portfolio_value) : "-"}
          detail={summary?.timestamp || "-"}
        />
        <MetricCard
          label="보유 현금"
          value={summary ? formatWon(summary.cash) : "-"}
          detail={summary ? `현금 비중 ${Math.max(0, 100 - utilization).toFixed(1)}%` : "-"}
        />
        <MetricCard
          label="보유 종목"
          value={summary ? `${summary.position_count}개` : "-"}
          detail={summary ? `주시 ${summary.watch_symbol_count}개` : "-"}
        />
        <MetricCard label="오늘 매수" value={summary ? `${summary.buy_count}건` : "-"} detail="주문 기준" />
        <MetricCard label="오늘 매도" value={summary ? `${summary.sell_count}건` : "-"} detail="주문 기준" />
      </section>

      <div className="dashboard-grid">
        <div className="primary-column">
          <Panel
            title="자산 흐름"
            subtitle="일별 총 평가자산 추이"
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
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={equityData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="assetFlow" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.34} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e6ebf2" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#6b7684", fontSize: 12 }}
                      minTickGap={24}
                      tickMargin={10}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={52}
                      tick={{ fill: "#6b7684", fontSize: 12 }}
                      tickFormatter={(value) => `${Math.round(value / 10000)}만`}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatWon(value), "총 평가자산"]}
                      labelFormatter={(label) => `기준일 ${label}`}
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

          <div className="dashboard-detail-grid">
            <Panel
              title="활성 진입 플랜"
              subtitle="현재 감시 중인 플랜 미리보기"
              action={
                <Link className="panel-link" to="/entry-plans">
                  전체 보기
                </Link>
              }
            >
              <div className="stack-list">
                {activeEntryPlans.length === 0 ? (
                  <EmptyState message="현재 활성 진입 플랜이 없습니다." />
                ) : (
                  entryPlanPreview.map((plan) => (
                    <article key={`${plan.symbol}-${plan.version}`} className="plan-row">
                      <div className="plan-top">
                        <div>
                          <strong>{plan.name}</strong>
                          <span>플랜 v{plan.version}</span>
                        </div>
                        <div className={`order-status ${metricTone(plan.plan_status === "armed" ? 1 : plan.plan_status === "invalidated" ? -1 : 0)}`}>
                          {planStatusLabel(plan.plan_status)}
                        </div>
                      </div>
                      <div className="plan-grid">
                        <span>진입 {formatWon(plan.entry_trigger_price)}</span>
                        <span>추격 상단 {formatWon(plan.max_chase_price)}</span>
                        <span>현재가 {plan.current_price > 0 ? formatWon(plan.current_price) : "-"}</span>
                      </div>
                      <div className="plan-bottom">
                        <span>만료 {plan.expires_at || "-"}</span>
                        <span>{plan.current_skip_reason || plan.reason || "-"}</span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </Panel>

            <Panel
              title="주시 종목"
              subtitle="현재 추적 중인 핵심 종목 미리보기"
              action={
                <Link className="panel-link" to="/watchlist">
                  전체 보기
                </Link>
              }
            >
              <div className="stack-list">
                {!watchlist || watchlist.items.length === 0 ? (
                  <EmptyState message="현재 주시 종목이 없습니다." />
                ) : (
                  watchlistPreview.map((item) => (
                    <article key={item.symbol} className="watchlist-row">
                      <div className="watchlist-top">
                        <div className="watchlist-symbol">
                          <div className="watchlist-symbol-line">
                            <span className={`watchlist-badge ${item.urgent ? "urgent" : "default"}`}>
                              {item.urgent ? "긴급 감시" : watchlistTierLabel(item.tier)}
                            </span>
                            {item.held ? <span className="watchlist-badge held">보유 중</span> : null}
                            <strong>{item.name || item.symbol}</strong>
                          </div>
                        </div>
                        <div className={`position-pnl watchlist-change ${metricTone(item.change_pct)}`}>
                          <strong>{formatPct(item.change_pct)}</strong>
                          <span>점수 {item.scan_score.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="watchlist-bottom">
                        <span>순위 {item.rank}</span>
                        <span>점수 {item.scan_score.toFixed(1)}</span>
                        <span>거래대금 {formatCompactWon(item.trade_amount)}</span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </Panel>
          </div>
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

          <Panel
            title="웹소켓 상태"
            subtitle="실시간 감시 연결과 수신 상태"
            action={<div className="inline-meta"><span>{websocketStatus?.status || "-"}</span></div>}
          >
            <div className="summary-stack">
              <div>
                <span>연결 상태</span>
                <strong>{websocketStatus?.status || "-"}</strong>
              </div>
              <div>
                <span>구독 종목</span>
                <strong>{websocketStatus?.subscription_count ?? 0}개</strong>
              </div>
              <div>
                <span>마지막 수신</span>
                <strong>{websocketStatus?.last_message_at || "-"}</strong>
              </div>
              <div>
                <span>피드 갱신</span>
                <strong>{websocketStatus?.feed_updated_at || "-"}</strong>
              </div>
            </div>
          </Panel>

          <Panel title="오늘 흐름 요약" subtitle="운영자가 바로 보는 핵심 수치">
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
