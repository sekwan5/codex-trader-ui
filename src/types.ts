export type SummaryResponse = {
  timestamp: string;
  portfolio_value: number;
  cash: number;
  position_count: number;
  buy_count: number;
  sell_count: number;
  trade_count: number;
  cycle_count: number;
  watch_symbol_count: number;
  watch_urgent_count: number;
  news_item_count: number;
  decision_source: string;
  runtime_role: string;
  loop_profile: string;
  daily_realized_pnl: number;
  daily_profit_target: number;
  db_path: string;
};

export type PositionItem = {
  symbol: string;
  name: string;
  shares: number;
  average_price: number;
  price: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  strategy_profile: string;
  capital_sleeve: string;
};

export type PositionsResponse = {
  items: PositionItem[];
  count: number;
};

export type TradeItem = {
  history_key: string;
  timestamp: string;
  symbol: string;
  name: string;
  action: string;
  shares: number;
  price: number;
  gross_amount: number;
  cash_delta: number;
  status: string;
  reason: string;
  risk_note: string;
  broker_order_no: string;
  realized_pnl_amount: number;
  realized_pnl_pct: number;
};

export type CycleItem = {
  cycle_key: string;
  timestamp: string;
  summary: string;
  buy_count: number;
  sell_count: number;
  executed_trade_count: number;
  portfolio_value: number;
  cash: number;
  daily_realized_pnl: number;
};

export type Pagination = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_prev: boolean;
  has_next: boolean;
};

export type TradesResponse = {
  items: TradeItem[];
  count: number;
  pagination: Pagination;
};

export type CyclesResponse = {
  items: CycleItem[];
  count: number;
  pagination: Pagination;
};

export type EquityItem = {
  timestamp: string;
  portfolio_value: number;
  cash: number;
  daily_realized_pnl: number;
};

export type EquityResponse = {
  items: EquityItem[];
  count: number;
};

export type HealthResponse = {
  status: string;
  db_path: string;
  db_exists: boolean;
  snapshot_exists: boolean;
  report_exists: boolean;
  runtime_settings_exists: boolean;
  runtime_service_exists: boolean;
  legacy_dashboard_json_exists: boolean;
  legacy_dashboard_html_exists: boolean;
};

export type RuntimeStatusResponse = {
  running: boolean;
  mode: string;
  pid: number | null;
  started_at: string;
  stopped_at: string;
  last_error: string;
  command: string[];
  settings?: RuntimeSettings;
  log_path: string;
  error_log_path: string;
};

export type RuntimeSettings = {
  decision_source: "auto" | "codex" | "sample";
  refresh_source: "snapshot" | "kis" | "scan";
  scan_market: "kospi" | "kosdaq" | "all";
  scan_limit: number;
  interval_seconds: number;
  iterations: number;
  loop_profile: "standard" | "scalp_fast";
  news_source: "none" | "google" | "naver";
  news_limit: number;
  watchlist_size: number;
  market_session_end: string;
};

export type RuntimeSettingsResponse = {
  settings: RuntimeSettings;
  command_preview: string[];
  saved?: boolean;
  applied_now?: boolean;
  message?: string;
  runtime_status?: RuntimeStatusResponse;
};
