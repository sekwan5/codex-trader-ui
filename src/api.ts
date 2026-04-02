import type {
  CyclesResponse,
  EquityResponse,
  HealthResponse,
  PositionsResponse,
  RuntimeSettingsResponse,
  RuntimeStatusResponse,
  SummaryResponse,
  TradesResponse,
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
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export function fetchSummary(): Promise<SummaryResponse> {
  return request<SummaryResponse>("/api/dashboard/summary");
}

export function fetchPositions(): Promise<PositionsResponse> {
  return request<PositionsResponse>("/api/dashboard/positions");
}

export function fetchTrades(page: number, pageSize: number): Promise<TradesResponse> {
  return request<TradesResponse>(`/api/dashboard/trades?page=${page}&page_size=${pageSize}`);
}

export function fetchCycles(page: number, pageSize: number): Promise<CyclesResponse> {
  return request<CyclesResponse>(`/api/dashboard/cycles?page=${page}&page_size=${pageSize}`);
}

export function fetchEquity(): Promise<EquityResponse> {
  return request<EquityResponse>("/api/dashboard/equity");
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
