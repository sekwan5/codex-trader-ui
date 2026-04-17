import { memo, useDeferredValue, useMemo, useState } from "react";

import { useTradingWorkspace } from "../app/TradingWorkspaceContext";
import { EmptyState } from "../components/common/EmptyState";
import { PaginationBar } from "../components/common/PaginationBar";
import { PageHeader } from "../components/common/PageHeader";
import { Panel } from "../components/common/Panel";
import type { EntryPlanItem, Pagination } from "../types";
import { formatCompactWon, formatPct, formatWon, metricTone } from "../utils/formatters";

const PLAN_PAGE_SIZE = 8;
const WATCHLIST_PAGE_SIZE = 10;

function isVisibleActivePlan(plan: EntryPlanItem): boolean {
  return plan.plan_status === "armed" || plan.plan_status === "standby";
}

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

function currentGapText(plan: EntryPlanItem): string {
  if (plan.current_price <= 0) return "실시간 가격 대기";
  const gapPct = ((plan.current_price / Math.max(plan.entry_trigger_price, 1)) - 1) * 100;
  return `진입가 대비 ${formatPct(gapPct)}`;
}

function buildPagination(totalItems: number, page: number, pageSize: number): Pagination | null {
  if (totalItems <= 0) return null;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  return {
    page: currentPage,
    page_size: pageSize,
    total_items: totalItems,
    total_pages: totalPages,
    has_prev: currentPage > 1,
    has_next: currentPage < totalPages,
  };
}

function WatchlistPageComponent() {
  const { entryPlans, watchlist } = useTradingWorkspace();
  const [planPage, setPlanPage] = useState(1);
  const [watchlistPage, setWatchlistPage] = useState(1);
  const deferredEntryPlans = useDeferredValue(entryPlans?.items ?? []);
  const deferredWatchlist = useDeferredValue(watchlist?.items ?? []);

  const activePlans = useMemo(
    () => deferredEntryPlans.filter((plan) => isVisibleActivePlan(plan)),
    [deferredEntryPlans],
  );

  const planPagination = useMemo(
    () => buildPagination(activePlans.length, planPage, PLAN_PAGE_SIZE),
    [activePlans.length, planPage],
  );
  const activePlanItems = useMemo(() => {
    const safePage = planPagination?.page ?? 1;
    const start = (safePage - 1) * PLAN_PAGE_SIZE;
    return activePlans.slice(start, start + PLAN_PAGE_SIZE);
  }, [activePlans, planPagination?.page]);

  const watchlistPagination = useMemo(
    () => buildPagination(deferredWatchlist.length, watchlistPage, WATCHLIST_PAGE_SIZE),
    [deferredWatchlist.length, watchlistPage],
  );
  const watchlistItems = useMemo(() => {
    const safePage = watchlistPagination?.page ?? 1;
    const start = (safePage - 1) * WATCHLIST_PAGE_SIZE;
    return deferredWatchlist.slice(start, start + WATCHLIST_PAGE_SIZE);
  }, [deferredWatchlist, watchlistPagination?.page]);

  return (
    <div className="page-stack">
      <PageHeader
        title="주시 종목"
        description="현재 감시 중인 플랜과 주시 종목을 한 화면에서 함께 확인합니다."
      />

      <div className="page-grid-two">
        <Panel
          title="활성 진입 플랜"
          subtitle={`현재 유효 ${activePlans.length}건`}
          action={<PaginationBar pagination={planPagination} onPageChange={setPlanPage} />}
        >
          <div className="stack-list">
            {activePlans.length === 0 ? (
              <div className="empty-state">
                <strong>{entryPlans?.empty_state_reason || "현재 유효한 진입 플랜이 없습니다."}</strong>
                <div className="runtime-ai-note">
                  <span>{entryPlans?.empty_state_detail || "현재 유효한 진입 플랜이 없습니다."}</span>
                </div>
              </div>
            ) : (
              activePlanItems.map((plan) => (
                <article key={`${plan.symbol}-${plan.version}`} className="detail-card">
                  <div className="detail-card-top">
                    <div className="detail-heading">
                      <strong>{plan.name}</strong>
                      <span>플랜 v{plan.version}</span>
                    </div>
                    <div
                      className={`order-status ${metricTone(plan.plan_status === "armed" ? 1 : 0)}`}
                      title={plan.current_skip_detail || plan.reason || ""}
                    >
                      {planStatusLabel(plan.plan_status)}
                    </div>
                  </div>

                  <div className="entry-plan-price-row">
                    <div className="entry-plan-price-card">
                      <span className="detail-label">현재가</span>
                      <strong>{plan.current_price > 0 ? formatWon(plan.current_price) : "-"}</strong>
                      <small>{currentGapText(plan)}</small>
                    </div>
                    <div className="entry-plan-price-card">
                      <span className="detail-label">진입가</span>
                      <strong>{formatWon(plan.entry_trigger_price)}</strong>
                      <small>추격 상단 {formatWon(plan.max_chase_price)}</small>
                    </div>
                    <div className="entry-plan-price-card">
                      <span className="detail-label">손절 / 익절</span>
                      <strong>
                        {formatWon(plan.stop_loss_price)} / {formatWon(plan.take_profit_price)}
                      </strong>
                      <small>수량 {plan.shares.toLocaleString("ko-KR")}주 · 신뢰도 {(plan.confidence * 100).toFixed(0)}%</small>
                    </div>
                  </div>

                  <div className="detail-grid">
                    <div className="detail-block">
                      <span className="detail-label">현재 보류 사유</span>
                      <strong>{plan.current_skip_reason || "-"}</strong>
                      <small>{plan.current_skip_detail || "현재 즉시 진입 조건을 점검 중입니다."}</small>
                    </div>
                    <div className="detail-block">
                      <span className="detail-label">플랜 사유</span>
                      <strong>{plan.reason || "-"}</strong>
                      <small>{plan.risk_note || "추가 리스크 메모가 없습니다."}</small>
                    </div>
                  </div>

                  <div className="detail-footer">
                    <span>만료 {plan.expires_at || "-"}</span>
                    <span>종목코드 {plan.symbol}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </Panel>

        <Panel
          title="주시 종목"
          subtitle={`총 ${watchlist?.count ?? 0}개 · 긴급 ${watchlist?.urgent_count ?? 0}개 · 갱신 ${watchlist?.generated_at || "-"}`}
          action={<PaginationBar pagination={watchlistPagination} onPageChange={setWatchlistPage} />}
        >
          <div className="stack-list">
            {!watchlist || watchlist.items.length === 0 ? (
              <EmptyState message="현재 주시 종목이 없습니다." />
            ) : (
              watchlistItems.map((item) => (
                <article key={item.symbol} className="detail-card">
                  <div className="detail-card-top">
                    <div className="watchlist-symbol-line">
                      <span className={`watchlist-badge ${item.urgent ? "urgent" : "default"}`}>
                        {item.urgent ? "긴급 감시" : watchlistTierLabel(item.tier)}
                      </span>
                      {item.held ? <span className="watchlist-badge held">보유 중</span> : null}
                      <strong>{item.name || item.symbol}</strong>
                    </div>
                    <div className={`position-pnl watchlist-change ${metricTone(item.change_pct)}`}>
                      <strong>{formatPct(item.change_pct)}</strong>
                    </div>
                  </div>

                  <div className="detail-metrics">
                    <span>순위 {item.rank}</span>
                    <span>점수 {item.scan_score.toFixed(1)}</span>
                    <span>거래대금 {formatCompactWon(item.trade_amount)}</span>
                    <span>종목코드 {item.symbol}</span>
                  </div>

                  <div className="detail-grid">
                    <div className="detail-block detail-block-wide">
                      <span className="detail-label">감시 이유</span>
                      <strong>{item.reason || "실시간 감시 조건을 유지 중입니다."}</strong>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export default memo(WatchlistPageComponent);
