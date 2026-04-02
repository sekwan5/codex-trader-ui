import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  fetchCycles,
  fetchDailyPerformance,
  fetchEntryPlans,
  fetchEquity,
  fetchHealth,
  fetchOrders,
  fetchPositions,
  fetchRuntimeStatus,
  fetchSummary,
  fetchTrades,
  fetchWatchlist,
  fetchWebsocketStatus,
  openDashboardStream,
  startRuntime,
  stopRuntime,
  triggerRefresh,
} from "../api";
import type {
  CyclesResponse,
  DailyPerformanceResponse,
  EntryPlansResponse,
  EquityResponse,
  HealthResponse,
  OrdersResponse,
  PositionsResponse,
  RuntimeStatusResponse,
  SummaryResponse,
  TradesResponse,
  WatchlistResponse,
  WebsocketStatusResponse,
} from "../types";

const PAGE_SIZE = 5;
const AUTO_REFRESH_ENABLED_KEY = "trader.autoRefreshEnabled";
const AUTO_REFRESH_SECONDS_KEY = "trader.autoRefreshSeconds";
const DEFAULT_AUTO_REFRESH_SECONDS = 20;

type WorkspaceContextValue = {
  summary: SummaryResponse | null;
  positions: PositionsResponse;
  watchlist: WatchlistResponse | null;
  entryPlans: EntryPlansResponse | null;
  orders: OrdersResponse | null;
  dailyPerformance: DailyPerformanceResponse | null;
  trades: TradesResponse | null;
  cycles: CyclesResponse | null;
  equity: EquityResponse;
  health: HealthResponse | null;
  runtimeStatus: RuntimeStatusResponse | null;
  websocketStatus: WebsocketStatusResponse | null;
  tradePage: number;
  orderPage: number;
  cyclePage: number;
  performancePage: number;
  loading: boolean;
  refreshing: boolean;
  runtimePending: boolean;
  error: string;
  lastLoadedAt: string;
  autoRefreshEnabled: boolean;
  autoRefreshSeconds: number;
  networkOnline: boolean;
  streamConnected: boolean;
  setTradePage: (page: number) => void;
  setOrderPage: (page: number) => void;
  setCyclePage: (page: number) => void;
  setPerformancePage: (page: number) => void;
  setAutoRefreshEnabled: (value: boolean) => void;
  setAutoRefreshSeconds: (value: number) => void;
  refreshAll: () => Promise<void>;
  startRuntimeSafe: () => Promise<void>;
  stopRuntimeSafe: () => Promise<void>;
};

const TradingWorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function TradingWorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [positions, setPositions] = useState<PositionsResponse>({ items: [], count: 0 });
  const [watchlist, setWatchlist] = useState<WatchlistResponse | null>(null);
  const [entryPlans, setEntryPlans] = useState<EntryPlansResponse | null>(null);
  const [orders, setOrders] = useState<OrdersResponse | null>(null);
  const [dailyPerformance, setDailyPerformance] = useState<DailyPerformanceResponse | null>(null);
  const [trades, setTrades] = useState<TradesResponse | null>(null);
  const [cycles, setCycles] = useState<CyclesResponse | null>(null);
  const [equity, setEquity] = useState<EquityResponse>({ items: [], count: 0 });
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatusResponse | null>(null);
  const [websocketStatus, setWebsocketStatus] = useState<WebsocketStatusResponse | null>(null);
  const [tradePage, setTradePageState] = useState(1);
  const [orderPage, setOrderPageState] = useState(1);
  const [cyclePage, setCyclePageState] = useState(1);
  const [performancePage, setPerformancePageState] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runtimePending, setRuntimePending] = useState(false);
  const [error, setError] = useState("");
  const [lastLoadedAt, setLastLoadedAt] = useState("");
  const [autoRefreshEnabled, setAutoRefreshEnabledState] = useState(true);
  const [autoRefreshSeconds, setAutoRefreshSecondsState] = useState(DEFAULT_AUTO_REFRESH_SECONDS);
  const [networkOnline, setNetworkOnline] = useState(() => window.navigator.onLine);
  const [streamConnected, setStreamConnected] = useState(false);
  const inFlightRef = useRef(false);
  const streamRefreshTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const storedEnabled = window.localStorage.getItem(AUTO_REFRESH_ENABLED_KEY);
    const storedSeconds = window.localStorage.getItem(AUTO_REFRESH_SECONDS_KEY);
    if (storedEnabled !== null) {
      setAutoRefreshEnabledState(storedEnabled !== "false");
    }
    if (storedSeconds !== null) {
      const parsed = Number.parseInt(storedSeconds, 10);
      if (Number.isFinite(parsed) && parsed >= 5 && parsed <= 300) {
        setAutoRefreshSecondsState(parsed);
      }
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setNetworkOnline(true);
    const handleOffline = () => setNetworkOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(AUTO_REFRESH_ENABLED_KEY, String(autoRefreshEnabled));
  }, [autoRefreshEnabled]);

  useEffect(() => {
    window.localStorage.setItem(AUTO_REFRESH_SECONDS_KEY, String(autoRefreshSeconds));
  }, [autoRefreshSeconds]);

  const loadDashboard = useCallback(
    async (options?: { preserveLoading?: boolean }) => {
      const preserveLoading = options?.preserveLoading ?? false;
      if (inFlightRef.current) {
        return;
      }
      inFlightRef.current = true;
      if (!preserveLoading) {
        setLoading(true);
      }
      setError("");
      try {
        const [
          nextSummary,
          nextPositions,
          nextWatchlist,
          nextEntryPlans,
          nextOrders,
          nextDailyPerformance,
          nextTrades,
          nextCycles,
          nextEquity,
          nextHealth,
          nextRuntimeStatus,
          nextWebsocketStatus,
        ] = await Promise.all([
          fetchSummary(),
          fetchPositions(),
          fetchWatchlist(),
          fetchEntryPlans(),
          fetchOrders(orderPage, PAGE_SIZE),
          fetchDailyPerformance(performancePage, PAGE_SIZE),
          fetchTrades(tradePage, PAGE_SIZE),
          fetchCycles(cyclePage, PAGE_SIZE),
          fetchEquity(),
          fetchHealth(),
          fetchRuntimeStatus(),
          fetchWebsocketStatus(),
        ]);
        setSummary(nextSummary);
        setPositions(nextPositions);
        setWatchlist(nextWatchlist);
        setEntryPlans(nextEntryPlans);
        setOrders(nextOrders);
        setDailyPerformance(nextDailyPerformance);
        setTrades(nextTrades);
        setCycles(nextCycles);
        setEquity(nextEquity);
        setHealth(nextHealth);
        setRuntimeStatus(nextRuntimeStatus);
        setWebsocketStatus(nextWebsocketStatus);
        setLastLoadedAt(new Date().toLocaleString("ko-KR"));
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "데이터를 불러오지 못했습니다.");
      } finally {
        inFlightRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [cyclePage, orderPage, performancePage, tradePage],
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!autoRefreshEnabled || !networkOnline || streamConnected) {
      return;
    }
    const intervalId = window.setInterval(() => {
      if (document.hidden) {
        return;
      }
      void loadDashboard({ preserveLoading: true });
    }, autoRefreshSeconds * 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoRefreshEnabled, autoRefreshSeconds, loadDashboard, networkOnline, streamConnected]);

  useEffect(() => {
    if (!autoRefreshEnabled || !networkOnline) {
      return;
    }
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void loadDashboard({ preserveLoading: true });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [autoRefreshEnabled, loadDashboard, networkOnline]);

  useEffect(() => {
    if (!autoRefreshEnabled || !networkOnline) {
      setStreamConnected(false);
      return;
    }

    const source = openDashboardStream({
      onOpen: () => {
        setStreamConnected(true);
      },
      onMessage: () => {
        if (document.hidden) {
          return;
        }
        if (streamRefreshTimeoutRef.current !== null) {
          return;
        }
        streamRefreshTimeoutRef.current = window.setTimeout(() => {
          streamRefreshTimeoutRef.current = null;
          void loadDashboard({ preserveLoading: true });
        }, 250);
      },
      onError: () => {
        setStreamConnected(false);
      },
    });

    return () => {
      setStreamConnected(false);
      if (streamRefreshTimeoutRef.current !== null) {
        window.clearTimeout(streamRefreshTimeoutRef.current);
        streamRefreshTimeoutRef.current = null;
      }
      source.close();
    };
  }, [autoRefreshEnabled, loadDashboard, networkOnline]);

  async function refreshAll() {
    if (!networkOnline) {
      setError("오프라인 상태라 새로고침을 수행할 수 없습니다.");
      return;
    }
    setRefreshing(true);
    setError("");
    try {
      await triggerRefresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "새로고침 중 오류가 발생했습니다.");
      setRefreshing(false);
      return;
    }
    await loadDashboard({ preserveLoading: true });
  }

  async function startRuntimeSafe() {
    setRuntimePending(true);
    setError("");
    try {
      const payload = await startRuntime();
      setRuntimeStatus(payload);
      await loadDashboard({ preserveLoading: true });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "런타임 시작 중 오류가 발생했습니다.");
    } finally {
      setRuntimePending(false);
    }
  }

  async function stopRuntimeSafe() {
    setRuntimePending(true);
    setError("");
    try {
      const payload = await stopRuntime();
      setRuntimeStatus(payload);
      await loadDashboard({ preserveLoading: true });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "런타임 중지 중 오류가 발생했습니다.");
    } finally {
      setRuntimePending(false);
    }
  }

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      summary,
      positions,
      watchlist,
      entryPlans,
      orders,
      dailyPerformance,
      trades,
      cycles,
      equity,
      health,
      runtimeStatus,
      websocketStatus,
      tradePage,
      orderPage,
      cyclePage,
      performancePage,
      loading,
      refreshing,
      runtimePending,
      error,
      lastLoadedAt,
      autoRefreshEnabled,
      autoRefreshSeconds,
      networkOnline,
      streamConnected,
      setTradePage: (page: number) => {
        startTransition(() => {
          setTradePageState(page);
        });
      },
      setOrderPage: (page: number) => {
        startTransition(() => {
          setOrderPageState(page);
        });
      },
      setCyclePage: (page: number) => {
        startTransition(() => {
          setCyclePageState(page);
        });
      },
      setPerformancePage: (page: number) => {
        startTransition(() => {
          setPerformancePageState(page);
        });
      },
      setAutoRefreshEnabled: (value: boolean) => {
        setAutoRefreshEnabledState(value);
      },
      setAutoRefreshSeconds: (value: number) => {
        setAutoRefreshSecondsState(Math.min(300, Math.max(5, value)));
      },
      refreshAll,
      startRuntimeSafe,
      stopRuntimeSafe,
    }),
    [
      summary,
      positions,
      watchlist,
      entryPlans,
      orders,
      dailyPerformance,
      trades,
      cycles,
      equity,
      health,
      runtimeStatus,
      websocketStatus,
      tradePage,
      orderPage,
      cyclePage,
      performancePage,
      loading,
      refreshing,
      runtimePending,
      error,
      lastLoadedAt,
      autoRefreshEnabled,
      autoRefreshSeconds,
      networkOnline,
      streamConnected,
    ],
  );

  return <TradingWorkspaceContext.Provider value={value}>{children}</TradingWorkspaceContext.Provider>;
}

export function useTradingWorkspace() {
  const value = useContext(TradingWorkspaceContext);
  if (!value) {
    throw new Error("useTradingWorkspace must be used inside TradingWorkspaceProvider.");
  }
  return value;
}
