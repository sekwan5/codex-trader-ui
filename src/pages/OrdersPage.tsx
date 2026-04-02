import { memo, useDeferredValue } from "react";

import { useTradingWorkspace } from "../app/TradingWorkspaceContext";
import { EmptyState } from "../components/common/EmptyState";
import { PageHeader } from "../components/common/PageHeader";
import { PaginationBar } from "../components/common/PaginationBar";
import { Panel } from "../components/common/Panel";
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

function formatGapPct(value: number) {
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${prefix}${Math.abs(value).toFixed(2)}%`;
}

function OrdersPageComponent() {
  const { orders, setOrderPage } = useTradingWorkspace();
  const deferredOrders = useDeferredValue(orders?.items ?? []);

  return (
    <div className="page-stack">
      <PageHeader
        title="주문 상태"
        description="미체결, 부분체결, 체결완료, 취소 상태를 최근 순서대로 확인합니다."
      />

      <Panel
        title="최근 주문 상태"
        subtitle="주문번호와 체결 수량, 평균 체결가를 함께 확인합니다."
        action={<PaginationBar pagination={orders?.pagination ?? null} onPageChange={setOrderPage} />}
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
                <th>주문가</th>
                <th>평균체결가</th>
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
                    <td>{statusLabel(item.status)}</td>
                    <td>
                      요청 {item.requested_shares.toLocaleString("ko-KR")}주
                      <br />
                      체결 {item.filled_qty.toLocaleString("ko-KR")} / 잔량 {item.remaining_qty.toLocaleString("ko-KR")}
                    </td>
                    <td>{formatWon(item.order_price || item.decision_price)}</td>
                    <td>{formatWon(item.avg_price || item.execution_price)}</td>
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
        <Panel title="체결 금액" subtitle="최근 주문의 체결 금액과 가격 차이">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>종목</th>
                  <th>체결금액</th>
                  <th>가격차이</th>
                  <th>체결확정</th>
                </tr>
              </thead>
              <tbody>
                {deferredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState compact message="표시할 주문이 없습니다." />
                    </td>
                  </tr>
                ) : (
                  deferredOrders.slice(0, 5).map((item) => (
                    <tr key={`${item.order_key}-fill`}>
                      <td>{item.name || item.symbol}</td>
                      <td>{formatWon(item.filled_amount || item.gross_amount)}</td>
                      <td>{formatGapPct(item.price_gap_pct || 0)}</td>
                      <td>{item.fill_confirmed ? "확정" : "대기"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="브로커 주문 시도" subtitle={`기록 수 ${orders?.broker_attempt_count ?? 0}건`}>
          <EmptyState compact message="브로커 주문 시도 상세는 다음 단계에서 추가할 예정입니다." />
        </Panel>
      </div>
    </div>
  );
}

export default memo(OrdersPageComponent);
