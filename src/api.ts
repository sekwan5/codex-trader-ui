import type {
  DailyPerformanceResponse,
  EntryPlansResponse,
  EquityResponse,
  HealthResponse,
  OrdersResponse,
  PositionsResponse,
  RuntimeSettingsResponse,
  RuntimeStatusResponse,
  SkipReasonsResponse,
  SummaryResponse,
  WatchlistResponse,
  WebsocketStatusResponse,
} from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    method: init?.method ?? "GET",
    body: init?.body,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const bodyText = await response.text();
    const detail = bodyText.trim();
    let message = `${response.status} ${response.statusText}`;
    if (detail) {
      try {
        const parsed = JSON.parse(detail) as { error?: string; message?: string };
        const apiMessage = String(parsed.error || parsed.message || "").trim();
        if (apiMessage) {
          message = apiMessage;
        } else {
          message = detail;
        }
      } catch {
        message = detail;
      }
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export function fetchSummary(): Promise<SummaryResponse> {
  return request<SummaryResponse>("/api/dashboard/summary");
}

export function fetchPositions(): Promise<PositionsResponse> {
  return request<PositionsResponse>("/api/dashboard/positions");
}

export function fetchWatchlist(): Promise<WatchlistResponse> {
  return request<WatchlistResponse>("/api/dashboard/watchlist");
}

export function fetchEntryPlans(): Promise<EntryPlansResponse> {
  return request<EntryPlansResponse>("/api/dashboard/entry-plans");
}

export function fetchEquity(): Promise<EquityResponse> {
  return request<EquityResponse>("/api/dashboard/equity");
}

export function fetchOrders(page: number, pageSize: number): Promise<OrdersResponse> {
  return request<OrdersResponse>(`/api/dashboard/orders?page=${page}&page_size=${pageSize}`);
}

export function fetchSkipReasons(page: number, pageSize: number): Promise<SkipReasonsResponse> {
  return request<SkipReasonsResponse>(`/api/dashboard/skip-reasons?page=${page}&page_size=${pageSize}`);
}

export function fetchDailyPerformance(page: number, pageSize: number): Promise<DailyPerformanceResponse> {
  return request<DailyPerformanceResponse>(`/api/dashboard/daily-performance?page=${page}&page_size=${pageSize}`);
}

export function fetchWebsocketStatus(): Promise<WebsocketStatusResponse> {
  return request<WebsocketStatusResponse>("/api/dashboard/websocket-status");
}

export function fetchHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/api/health");
}

export function triggerRefresh(): Promise<unknown> {
  return request("/api/refresh-market");
}

export function fetchRuntimeStatus(): Promise<RuntimeStatusResponse> {
  return request<RuntimeStatusResponse>("/api/runtime/status");
}

export function startRuntime(): Promise<RuntimeStatusResponse> {
  return request<RuntimeStatusResponse>("/api/runtime/start", { method: "POST" });
}

export function stopRuntime(): Promise<RuntimeStatusResponse> {
  return request<RuntimeStatusResponse>("/api/runtime/stop", { method: "POST" });
}

export function fetchRuntimeSettings(): Promise<RuntimeSettingsResponse> {
  return request<RuntimeSettingsResponse>("/api/runtime/settings");
}

export function saveRuntimeSettings(
  settings: RuntimeSettingsResponse["settings"],
  options?: { applyNow?: boolean },
): Promise<RuntimeSettingsResponse> {
  return request<RuntimeSettingsResponse>("/api/runtime/settings", {
    method: "POST",
    body: JSON.stringify({ settings, apply_now: options?.applyNow ?? false }),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function openDashboardStream(handlers: {
  onOpen?: () => void;
  onMessage?: (payload: Record<string, unknown>) => void;
  onError?: () => void;
}): EventSource {
  const source = new EventSource("/api/stream/dashboard");
  source.addEventListener("open", () => {
    handlers.onOpen?.();
  });
  source.addEventListener("dashboard", (event) => {
    try {
      const payload = JSON.parse((event as MessageEvent).data) as Record<string, unknown>;
      handlers.onMessage?.(payload);
    } catch {
      handlers.onError?.();
    }
  });
  source.addEventListener("error", () => {
    handlers.onError?.();
  });
  return source;
}
