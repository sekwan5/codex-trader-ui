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
import { useLocation } from "react-router-dom";

import {
  fetchDailyPerformance,
  fetchEntryPlans,
  fetchEquity,
  fetchHealth,
  fetchOrders,
  fetchPositions,
  fetchRuntimeStatus,
  fetchSummary,
  fetchWatchlist,
  fetchWebsocketStatus,
  openDashboardStream,
  startRuntime,
  stopRuntime,
  triggerRefresh,
} from "../api";
import type {
  DailyPerformanceResponse,
  EntryPlansResponse,
  EquityResponse,
  HealthResponse,
  OrdersResponse,
  PositionsResponse,
  RuntimeStatusResponse,
  SummaryResponse,
  WatchlistResponse,
  WebsocketStatusResponse,
} from "../types";

const PAGE_SIZE = 5;
const AUTO_REFRESH_ENABLED_KEY = "trader.autoRefreshEnabled";
const AUTO_REFRESH_SECONDS_KEY = "trader.autoRefreshSeconds";
const DEFAULT_AUTO_REFRESH_SECONDS = 20;
const SLOW_REFRESH_MIN_SECONDS = 30;

type WorkspaceContextValue = {
  summary: SummaryResponse | null;
  positions: PositionsResponse;
  watchlist: WatchlistResponse | null;
  entryPlans: EntryPlansResponse | null;
  orders: OrdersResponse | null;
  dailyPerformance: DailyPerformanceResponse | null;
  equity: EquityResponse;
  health: HealthResponse | null;
  runtimeStatus: RuntimeStatusResponse | null;
  websocketStatus: WebsocketStatusResponse | null;
  orderPage: number;
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
  setOrderPage: (page: number) => void;
  setPerformancePage: (page: number) => void;
  setAutoRefreshEnabled: (value: boolean) => void;
  setAutoRefreshSeconds: (value: number) => void;
  refreshAll: () => Promise<void>;
  refreshSlowData: () => Promise<void>;
  startRuntimeSafe: () => Promise<void>;
  stopRuntimeSafe: () => Promise<void>;
};

const TradingWorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function TradingWorkspaceProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [positions, setPositions] = useState<PositionsResponse>({ items: [], count: 0 });
  const [watchlist, setWatchlist] = useState<WatchlistResponse | null>(null);
  const [entryPlans, setEntryPlans] = useState<EntryPlansResponse | null>(null);
  const [orders, setOrders] = useState<OrdersResponse | null>(null);
  const [dailyPerformance, setDailyPerformance] = useState<DailyPerformanceResponse | null>(null);
  const [equity, setEquity] = useState<EquityResponse>({ items: [], count: 0 });
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatusResponse | null>(null);
  const [websocketStatus, setWebsocketStatus] = useState<WebsocketStatusResponse | null>(null);
  const [orderPage, setOrderPageState] = useState(1);
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
  const fullInFlightRef = useRef(false);
  const liveInFlightRef = useRef(false);
  const slowInFlightRef = useRef(false);
  const streamRefreshTimeoutRef = useRef<number | null>(null);
  const pathname = location.pathname;
  const isDashboardRoute = pathname === "/dashboard";
  const isWatchlistRoute = pathname === "/watchlist";
  const isOrdersRoute = pathname === "/orders";
  const isPerformanceRoute = pathname === "/performance";
  const isRuntimeRoute = pathname === "/runtime";
  const isLivePollingRoute = isDashboardRoute || isWatchlistRoute;
  const shouldPollSlowData = isDashboardRoute;

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

  const loadLiveData = useCallback(async (options?: { preserveLoading?: boolean }) => {
    const preserveLoading = options?.preserveLoading ?? false;
    if (liveInFlightRef.current || fullInFlightRef.current) {
      return;
    }
    liveInFlightRef.current = true;
    if (!preserveLoading) {
      setLoading(true);
    }
    setError("");
    try {
      const nextSummary = await fetchSummary();
      if (isWatchlistRoute) {
        const [nextWatchlist, nextEntryPlans, nextWebsocketStatus] = await Promise.all([
          fetchWatchlist(),
          fetchEntryPlans(),
          fetchWebsocketStatus(),
        ]);
        startTransition(() => {
          setSummary(nextSummary);
          setWatchlist(nextWatchlist);
          setEntryPlans(nextEntryPlans);
          setWebsocketStatus(nextWebsocketStatus);
          setLastLoadedAt(new Date().toLocaleString("ko-KR"));
        });
      } else {
        const [
          nextPositions,
          nextWatchlist,
          nextEntryPlans,
          nextEquity,
          nextRuntimeStatus,
          nextWebsocketStatus,
        ] = await Promise.all([
          fetchPositions(),
          fetchWatchlist(),
          fetchEntryPlans(),
          fetchEquity(),
          fetchRuntimeStatus(),
          fetchWebsocketStatus(),
        ]);
        startTransition(() => {
          setSummary(nextSummary);
          setPositions(nextPositions);
          setWatchlist(nextWatchlist);
          setEntryPlans(nextEntryPlans);
          setEquity(nextEquity);
          setRuntimeStatus(nextRuntimeStatus);
          setWebsocketStatus(nextWebsocketStatus);
          setLastLoadedAt(new Date().toLocaleString("ko-KR"));
        });
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "데이터를 불러오지 못했습니다.");
    } finally {
      liveInFlightRef.current = false;
      setLoading(false);
    }
  }, [isWatchlistRoute]);

  const loadSlowData = useCallback(async () => {
    if (slowInFlightRef.current || fullInFlightRef.current) {
      return;
    }
    slowInFlightRef.current = true;
    try {
      const [nextOrders, nextDailyPerformance, nextHealth] = await Promise.all([
        fetchOrders(orderPage, PAGE_SIZE),
        fetchDailyPerformance(performancePage, PAGE_SIZE),
        fetchHealth(),
      ]);
      startTransition(() => {
        setOrders(nextOrders);
        setDailyPerformance(nextDailyPerformance);
        setHealth(nextHealth);
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "이력 데이터를 불러오지 못했습니다.");
    } finally {
      slowInFlightRef.current = false;
    }
  }, [orderPage, performancePage]);

  const loadOrdersData = useCallback(async () => {
    try {
      const nextOrders = await fetchOrders(orderPage, PAGE_SIZE);
      startTransition(() => {
        setOrders(nextOrders);
        setLastLoadedAt(new Date().toLocaleString("ko-KR"));
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "?? ???? ???? ?????.");
    }
  }, [orderPage]);

  const loadPerformanceData = useCallback(async () => {
    try {
      const nextDailyPerformance = await fetchDailyPerformance(performancePage, PAGE_SIZE);
      startTransition(() => {
        setDailyPerformance(nextDailyPerformance);
        setLastLoadedAt(new Date().toLocaleString("ko-KR"));
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "?? ?? ???? ???? ?????.");
    }
  }, [performancePage]);

  const loadRuntimePageData = useCallback(async () => {
    try {
      const [nextSummary, nextRuntimeStatus, nextWebsocketStatus, nextHealth] = await Promise.all([
        fetchSummary(),
        fetchRuntimeStatus(),
        fetchWebsocketStatus(),
        fetchHealth(),
      ]);
      startTransition(() => {
        setSummary(nextSummary);
        setRuntimeStatus(nextRuntimeStatus);
        setWebsocketStatus(nextWebsocketStatus);
        setHealth(nextHealth);
        setLastLoadedAt(new Date().toLocaleString("ko-KR"));
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "??? ??? ???? ?????.");
    }
  }, []);

  const loadDashboard = useCallback(async (options?: { preserveLoading?: boolean }) => {
    const preserveLoading = options?.preserveLoading ?? false;
    if (fullInFlightRef.current) {
      return;
    }
    fullInFlightRef.current = true;
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
        fetchEquity(),
        fetchHealth(),
        fetchRuntimeStatus(),
        fetchWebsocketStatus(),
      ]);
      startTransition(() => {
        setSummary(nextSummary);
        setPositions(nextPositions);
        setWatchlist(nextWatchlist);
        setEntryPlans(nextEntryPlans);
        setOrders(nextOrders);
        setDailyPerformance(nextDailyPerformance);
        setEquity(nextEquity);
        setHealth(nextHealth);
        setRuntimeStatus(nextRuntimeStatus);
        setWebsocketStatus(nextWebsocketStatus);
        setLastLoadedAt(new Date().toLocaleString("ko-KR"));
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "데이터를 불러오지 못했습니다.");
    } finally {
      fullInFlightRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderPage, performancePage]);

  useEffect(() => {
    setError("");
    if (isDashboardRoute) {
      void loadDashboard();
      return;
    }
    if (isWatchlistRoute) {
      void loadLiveData();
      return;
    }
    if (isOrdersRoute) {
      void loadOrdersData();
      return;
    }
    if (isPerformanceRoute) {
      void loadPerformanceData();
      return;
    }
    if (isRuntimeRoute) {
      void loadRuntimePageData();
    }
  }, [
    isDashboardRoute,
    isWatchlistRoute,
    isOrdersRoute,
    isPerformanceRoute,
    isRuntimeRoute,
    loadDashboard,
    loadOrdersData,
    loadPerformanceData,
    loadRuntimePageData,
  ]);

  useEffect(() => {
    if (!autoRefreshEnabled || !networkOnline || !shouldPollSlowData) {
      return;
    }
    // Keep a lightweight polling fallback even while SSE is connected so
    // current prices on active entry plans do not get stuck when stream
    // events are delayed or dropped.
    const refreshSeconds = streamConnected
      ? Math.max(SLOW_REFRESH_MIN_SECONDS, autoRefreshSeconds)
      : autoRefreshSeconds;
    const intervalId = window.setInterval(() => {
      if (document.hidden) {
        return;
      }
      void loadLiveData({ preserveLoading: true });
    }, refreshSeconds * 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoRefreshEnabled, autoRefreshSeconds, isLivePollingRoute, loadLiveData, networkOnline, streamConnected]);

  useEffect(() => {
    if (!autoRefreshEnabled || !networkOnline || !isLivePollingRoute) {
      return;
    }
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void loadLiveData({ preserveLoading: true });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [autoRefreshEnabled, isLivePollingRoute, loadLiveData, networkOnline]);

  useEffect(() => {
    if (!autoRefreshEnabled || !networkOnline || !isLivePollingRoute) {
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
          void loadLiveData({ preserveLoading: true });
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
  }, [autoRefreshEnabled, isLivePollingRoute, loadLiveData, networkOnline]);

  useEffect(() => {
    if (!autoRefreshEnabled || !networkOnline || !isLivePollingRoute) {
      return;
    }
    const slowRefreshSeconds = Math.max(SLOW_REFRESH_MIN_SECONDS, autoRefreshSeconds * 2);
    const intervalId = window.setInterval(() => {
      if (document.hidden) {
        return;
      }
      void loadSlowData();
    }, slowRefreshSeconds * 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoRefreshEnabled, autoRefreshSeconds, loadSlowData, networkOnline, shouldPollSlowData]);

  async function refreshAll() {
    if (!networkOnline) {
      setError("오프라인 상태에서는 새로고침을 실행할 수 없습니다.");
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

  async function refreshSlowData() {
    if (!networkOnline) {
      setError("오프라인 상태에서는 데이터를 새로 불러올 수 없습니다.");
      return;
    }
    setError("");
    await loadSlowData();
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
      equity,
      health,
      runtimeStatus,
      websocketStatus,
      orderPage,
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
      setOrderPage: (page: number) => {
        startTransition(() => {
          setOrderPageState(page);
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
      refreshSlowData,
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
      equity,
      health,
      runtimeStatus,
      websocketStatus,
      orderPage,
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
      loadSlowData,
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
