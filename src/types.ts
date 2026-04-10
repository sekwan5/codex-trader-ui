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
  ai_decision_status: {
    state: string;
    stage: string;
    started_at: string;
    completed_at: string;
    elapsed_seconds: number;
    prompt_symbol_count: number;
    prompt_symbols: string[];
    selection_mode: string;
    source: string;
    summary: string;
    last_completed_started_at?: string;
    last_completed_at?: string;
    last_completed_summary?: string;
  };
  timing: {
    cycle_seconds?: number;
    planning_cycle_seconds?: number;
    news_watch_seconds?: number;
    trade_decision_seconds?: number;
    daily_chart_context_seconds?: number;
  };
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

export type WatchlistItem = {
  rank: number;
  symbol: string;
  name: string;
  tier: string;
  change_pct: number;
  scan_score: number;
  trade_amount: number;
  urgent: boolean;
  held: boolean;
  reason: string;
};

export type WatchlistResponse = {
  generated_at: string;
  max_symbols: number;
  urgent_count: number;
  items: WatchlistItem[];
  count: number;
};

export type EntryPlanItem = {
  symbol: string;
  name: string;
  shares: number;
  confidence: number;
  source_action: string;
  plan_status: string;
  execution_mode: string;
  entry_trigger_price: number;
  max_chase_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  valid_minutes: number;
  created_at: string;
  expires_at: string;
  reason: string;
  risk_note: string;
  version: number;
  current_price: number;
  invalidated_reason: string;
  current_skip_reason: string;
  current_skip_detail: string;
};

export type EntryPlansResponse = {
  items: EntryPlanItem[];
  count: number;
  planned_entry_count: number;
  planned_entry_symbols: string[];
  execution_mode: string;
  empty_state_reason: string;
  empty_state_detail: string;
};

export type Pagination = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_prev: boolean;
  has_next: boolean;
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

export type OrderItem = {
  order_key: string;
  timestamp: string;
  symbol: string;
  name: string;
  action: string;
  side_code: string;
  status: string;
  shares: number;
  requested_shares: number;
  filled_qty: number;
  remaining_qty: number;
  decision_price: number;
  execution_price: number;
  order_price: number;
  avg_price: number;
  filled_amount: number;
  gross_amount: number;
  price_gap_pct: number;
  order_date: string;
  order_division: string;
  reason: string;
  broker_order_no: string;
  broker_branch_no: string;
  fill_confirmed: boolean;
  fill_source: string;
  realized_pnl_amount: number;
  realized_pnl_pct: number;
};

export type OrdersResponse = {
  items: OrderItem[];
  count: number;
  broker_attempt_count: number;
  pagination: Pagination;
};

export type SkipReasonItem = {
  skip_key: string;
  timestamp: string;
  cycle_timestamp: string;
  symbol: string;
  name: string;
  plan_status: string;
  version: number;
  current_skip_reason: string;
  current_skip_detail: string;
  current_price: number;
  entry_trigger_price: number;
  max_chase_price: number;
  invalidated_reason: string;
  confidence: number;
};

export type SkipReasonSummaryItem = {
  reason: string;
  count: number;
};

export type SkipReasonsResponse = {
  items: SkipReasonItem[];
  count: number;
  summary: SkipReasonSummaryItem[];
  pagination: Pagination;
};

export type DailyPerformanceItem = {
  history_key: string;
  trading_date: string;
  source_timestamp: string;
  portfolio_value: number;
  cash: number;
  position_count: number;
  evaluation_amount: number;
  daily_realized_pnl: number;
  account_total_profit_loss: number;
  account_daily_profit_loss: number;
  unrealized_profit_loss: number;
};

export type DailyPerformanceResponse = {
  items: DailyPerformanceItem[];
  count: number;
  pagination: Pagination;
};

export type WebsocketStatusResponse = {
  status: "connected" | "reconnecting" | "paused" | "disabled" | "disconnected" | "unknown";
  enabled: boolean;
  running: boolean;
  connected: boolean;
  reconnect_paused: boolean;
  last_error: string;
  last_connected_at: string;
  last_message_at: string;
  updated_at: string;
  subscription_count: number;
  watch_symbols: string[];
  active_symbols: string[];
  feed_updated_at: string;
  price_count: number;
  quote_count: number;
  fill_count: number;
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
  last_preflight?: {
    status: "passed" | "failed";
    checked_at: string;
    checks: Array<{
      key: string;
      label: string;
      ok: boolean;
      message: string;
    }>;
  } | null;
  command: string[];
  settings?: RuntimeSettings;
  log_path: string;
  error_log_path: string;
};

export type RuntimeSettings = {
  account_mode: "mock" | "live";
  decision_source: "auto" | "codex" | "sample";
  refresh_source: "snapshot" | "kis" | "scan";
  scan_market: "kospi" | "kosdaq" | "all";
  scan_limit: number;
  interval_seconds: number;
  iterations: number;
  loop_profile: "standard" | "scalp_fast";
  news_sources: Array<"none" | "google" | "naver">;
  news_source?: string;
  news_limit: number;
  watchlist_size: number;
  market_session_end: string;
  pending_order_policy: "keep" | "block_new_buys" | "same_symbol_only" | "fail_start";
  pending_order_cancel_after_seconds: number;
  daily_loss_limit_enabled: boolean;
  daily_loss_limit_pct: number;
};

export type RuntimeSettingsResponse = {
  settings: RuntimeSettings;
  command_preview: string[];
  saved?: boolean;
  applied_now?: boolean;
  message?: string;
  runtime_status?: RuntimeStatusResponse;
};
