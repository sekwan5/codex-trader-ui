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
  fetchEquity,
  fetchHealth,
  fetchPositions,
  fetchRuntimeStatus,
  fetchSummary,
  fetchTrades,
  startRuntime,
  stopRuntime,
  triggerRefresh,
} from "../api";
import type {
  CyclesResponse,
  EquityResponse,
  HealthResponse,
  PositionsResponse,
  RuntimeStatusResponse,
  SummaryResponse,
  TradesResponse,
} from "../types";

const PAGE_SIZE = 5;
const AUTO_REFRESH_ENABLED_KEY = "trader.autoRefreshEnabled";
const AUTO_REFRESH_SECONDS_KEY = "trader.autoRefreshSeconds";
const DEFAULT_AUTO_REFRESH_SECONDS = 20;

type WorkspaceContextValue = {
  summary: SummaryResponse | null;
  positions: PositionsResponse;
  trades: TradesResponse | null;
  cycles: CyclesResponse | null;
  equity: EquityResponse;
  health: HealthResponse | null;
  runtimeStatus: RuntimeStatusResponse | null;
  tradePage: number;
  cyclePage: number;
  loading: boolean;
  refreshing: boolean;
  runtimePending: boolean;
  error: string;
  lastLoadedAt: string;
  autoRefreshEnabled: boolean;
  autoRefreshSeconds: number;
  networkOnline: boolean;
  setTradePage: (page: number) => void;
  setCyclePage: (page: number) => void;
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
  const [trades, setTrades] = useState<TradesResponse | null>(null);
  const [cycles, setCycles] = useState<CyclesResponse | null>(null);
  const [equity, setEquity] = useState<EquityResponse>({ items: [], count: 0 });
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatusResponse | null>(null);
  const [tradePage, setTradePageState] = useState(1);
  const [cyclePage, setCyclePageState] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runtimePending, setRuntimePending] = useState(false);
  const [error, setError] = useState("");
  const [lastLoadedAt, setLastLoadedAt] = useState("");
  const [autoRefreshEnabled, setAutoRefreshEnabledState] = useState(true);
  const [autoRefreshSeconds, setAutoRefreshSecondsState] = useState(DEFAULT_AUTO_REFRESH_SECONDS);
  const [networkOnline, setNetworkOnline] = useState(() => window.navigator.onLine);
  const inFlightRef = useRef(false);

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
          nextTrades,
          nextCycles,
          nextEquity,
          nextHealth,
          nextRuntimeStatus,
        ] = await Promise.all([
          fetchSummary(),
          fetchPositions(),
          fetchTrades(tradePage, PAGE_SIZE),
          fetchCycles(cyclePage, PAGE_SIZE),
          fetchEquity(),
          fetchHealth(),
          fetchRuntimeStatus(),
        ]);
        setSummary(nextSummary);
        setPositions(nextPositions);
        setTrades(nextTrades);
        setCycles(nextCycles);
        setEquity(nextEquity);
        setHealth(nextHealth);
        setRuntimeStatus(nextRuntimeStatus);
        setLastLoadedAt(new Date().toLocaleString("ko-KR"));
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "데이터를 불러오지 못했습니다.");
      } finally {
        inFlightRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [cyclePage, tradePage],
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!autoRefreshEnabled || !networkOnline) {
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
  }, [autoRefreshEnabled, autoRefreshSeconds, loadDashboard, networkOnline]);

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
      trades,
      cycles,
      equity,
      health,
      runtimeStatus,
      tradePage,
      cyclePage,
      loading,
      refreshing,
      runtimePending,
      error,
      lastLoadedAt,
      autoRefreshEnabled,
      autoRefreshSeconds,
      networkOnline,
      setTradePage: (page: number) => {
        startTransition(() => {
          setTradePageState(page);
        });
      },
      setCyclePage: (page: number) => {
        startTransition(() => {
          setCyclePageState(page);
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
      trades,
      cycles,
      equity,
      health,
      runtimeStatus,
      tradePage,
      cyclePage,
      loading,
      refreshing,
      runtimePending,
      error,
      lastLoadedAt,
      autoRefreshEnabled,
      autoRefreshSeconds,
      networkOnline,
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
