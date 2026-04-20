import { memo, useDeferredValue, useEffect, useState } from "react";

import { fetchSkipReasons } from "../api";
import { useTradingWorkspace } from "../app/TradingWorkspaceContext";
import { EmptyState } from "../components/common/EmptyState";
import { PageHeader } from "../components/common/PageHeader";
import { PaginationBar } from "../components/common/PaginationBar";
import { Panel } from "../components/common/Panel";
import type { OrderItem, SkipReasonsResponse } from "../types";
import { formatWon, shortTime } from "../utils/formatters";

function statusLabel(status: string) {
  switch (status) {
    case "executed":
      return "체결완료";
    case "partial":
      return "부분체결";
    case "submitted":
      return "주문접수";
    case "canceled":
      return "취소";
    case "expired":
      return "만료";
    case "failed":
      return "실패";
    default:
      return status || "-";
  }
}

function pnlClassName(value: number) {
  if (value > 0) {
    return "signed-pnl positive";
  }
  if (value < 0) {
    return "signed-pnl negative";
  }
  return "signed-pnl neutral";
}

function displayShares(item: OrderItem) {
  return Math.max(item.requested_shares || 0, item.shares || 0, item.filled_qty || 0);
}

function detailTime(timestamp: string) {
  return timestamp ? timestamp.slice(5, 19) : "-";
}

function OrdersPageComponent() {
  const { orders, setOrderPage } = useTradingWorkspace();
  const deferredOrders = useDeferredValue(orders?.items ?? []);
  const [skipReasons, setSkipReasons] = useState<SkipReasonsResponse | null>(null);
  const [skipReasonPage, setSkipReasonPage] = useState(1);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const payload = await fetchSkipReasons(skipReasonPage, 6);
        if (active) {
          setSkipReasons(payload);
        }
      } catch {
        if (active) {
          setSkipReasons(null);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [skipReasonPage]);

  return (
    <div className="page-stack">
      <PageHeader
        title="주문 상태"
        description="주문 흐름과 진입 보류 사유를 함께 보며, 실제 체결과 막힌 이유를 같이 확인합니다."
      />

      <Panel
        title="최근 주문 상태"
        subtitle="수량, 주문가, 평균 체결가와 매도 손익 위주로 최근 주문 흐름을 봅니다."
        action={<PaginationBar pagination={orders?.pagination ?? null} onPageChange={setOrderPage} />}
      >
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>시각</th>
                <th>종목</th>
                <th>구분</th>
                <th>수량</th>
                <th>주문가</th>
                <th>평균체결가</th>
                <th>매도 수익</th>
                <th>사유</th>
                <th>주문번호</th>
              </tr>
            </thead>
            <tbody>
              {deferredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState compact message="주문 상태 기록이 아직 없습니다." />
                  </td>
                </tr>
              ) : (
                deferredOrders.map((item) => (
                  <tr key={item.order_key}>
                    <td>{shortTime(item.timestamp)}</td>
                    <td>
                      <div className="symbol-cell">
                        <strong>{item.name || item.symbol}</strong>
                        <span>{item.symbol}</span>
                      </div>
                    </td>
                    <td>{item.action === "buy" ? "매수" : item.action === "sell" ? "매도" : item.action}</td>
                    <td>{displayShares(item).toLocaleString("ko-KR")}주</td>
                    <td>{formatWon(item.order_price || item.decision_price)}</td>
                    <td>{formatWon(item.avg_price || item.execution_price)}</td>
                    <td>
                      {item.action === "sell" ? (
                        <span className={pnlClassName(item.realized_pnl_amount || 0)}>
                          {formatWon(item.realized_pnl_amount || 0)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <div className="summary-cell">{item.reason || statusLabel(item.status) || item.fill_source || "-"}</div>
                    </td>
                    <td>
                      <div className="symbol-cell">
                        <strong>{item.broker_order_no || "-"}</strong>
                        <span>{item.fill_source || "-"}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="page-grid-two">
        <Panel
          title="진입 보류 사유 로그"
          subtitle="오늘 실제로 막혔던 이유를 시간순으로 모아두고, 튜닝 근거로 사용합니다."
          action={<PaginationBar pagination={skipReasons?.pagination ?? null} onPageChange={setSkipReasonPage} />}
        >
          <div className="stack-list">
            {skipReasons?.items.length ? (
              skipReasons.items.map((item) => (
                <article key={item.skip_key} className="order-row">
                  <div className="order-top">
                    <div>
                      <strong>{item.name || item.symbol}</strong>
                      <span>{item.current_skip_reason || "-"}</span>
                    </div>
                    <div className="inline-meta">
                      <span>{detailTime(item.timestamp)}</span>
                    </div>
                  </div>
                  <div className="order-bottom">
                    <span className="summary-cell">{item.current_skip_detail || "-"}</span>
                  </div>
                  <div className="order-bottom">
                    <span>현재가 {formatWon(item.current_price)}</span>
                    <span>진입가 {formatWon(item.entry_trigger_price)}</span>
                    <span>추격 상단 {formatWon(item.max_chase_price)}</span>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState compact message="누적된 진입 보류 사유가 아직 없습니다." />
            )}
          </div>
        </Panel>

        <Panel title="사유별 집계" subtitle="오늘 가장 많이 막힌 이유를 바로 확인합니다.">
          <div className="stack-list">
            {skipReasons?.summary?.length ? (
              skipReasons.summary.map((item) => (
                <article key={item.reason} className="order-row">
                  <div className="order-top">
                    <div>
                      <strong>{item.reason}</strong>
                      <span>오늘 누적</span>
                    </div>
                    <div className="inline-meta">
                      <span>{item.count}건</span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState compact message="사유 집계가 아직 없습니다." />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export default memo(OrdersPageComponent);
