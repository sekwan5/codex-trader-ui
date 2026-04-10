import { memo, useEffect, useState } from "react";

import { fetchRuntimeSettings, saveRuntimeSettings } from "../api";
import { useTradingWorkspace } from "../app/TradingWorkspaceContext";
import { EmptyState } from "../components/common/EmptyState";
import { PageHeader } from "../components/common/PageHeader";
import { Panel } from "../components/common/Panel";
import type { RuntimeSettings, RuntimeSettingsResponse } from "../types";

const NEWS_SOURCE_OPTIONS: Array<{
  value: "naver" | "google" | "none";
  label: string;
  description: string;
}> = [
  { value: "naver", label: "네이버 뉴스", description: "국내 종목 뉴스 흐름을 빠르게 수집합니다." },
  { value: "google", label: "구글 뉴스", description: "글로벌 기사와 보조 흐름을 함께 확인합니다." },
  { value: "none", label: "사용 안 함", description: "뉴스 없이 시세와 수급만 봅니다." },
];

const ACCOUNT_MODE_OPTIONS = [
  { value: "mock", label: "KIS 모의투자" },
  { value: "live", label: "KIS 실계좌" },
] as const;

const DECISION_SOURCE_OPTIONS = [
  { value: "auto", label: "자동 판단" },
  { value: "codex", label: "AI 판단" },
  { value: "sample", label: "샘플 판단" },
] as const;

const LOOP_PROFILE_OPTIONS = [
  { value: "scalp_fast", label: "단타 빠른 루프" },
  { value: "standard", label: "기본 루프" },
] as const;

const PENDING_ORDER_POLICY_OPTIONS = [
  { value: "same_symbol_only", label: "같은 종목만 차단" },
  { value: "block_new_buys", label: "모든 신규 매수 차단" },
  { value: "keep", label: "그대로 유지" },
  { value: "fail_start", label: "시작 자체 차단" },
] as const;

const REFRESH_SOURCE_OPTIONS = [
  { value: "scan", label: "시장 스캔 기준" },
  { value: "kis", label: "KIS 시세 기준" },
  { value: "snapshot", label: "저장 스냅샷 기준" },
] as const;

const SCAN_MARKET_OPTIONS = [
  { value: "all", label: "전체 시장" },
  { value: "kospi", label: "코스피" },
  { value: "kosdaq", label: "코스닥" },
] as const;

function normalizeNewsSources(nextValues: string[]): RuntimeSettings["news_sources"] {
  const unique = Array.from(new Set(nextValues.filter(Boolean))) as RuntimeSettings["news_sources"];
  if (unique.includes("none") && unique.length > 1) {
    return unique.filter((item) => item !== "none") as RuntimeSettings["news_sources"];
  }
  return unique.length > 0 ? unique : ["none"];
}

function coerceNewsSources(settings: RuntimeSettings): RuntimeSettings["news_sources"] {
  if (Array.isArray(settings.news_sources) && settings.news_sources.length > 0) {
    return normalizeNewsSources(settings.news_sources);
  }
  if (typeof settings.news_source === "string" && settings.news_source.trim()) {
    return normalizeNewsSources(settings.news_source.split(",").map((item) => item.trim()));
  }
  return ["none"];
}

function normalizeLoadedSettings(settings: RuntimeSettings): RuntimeSettings {
  const newsSources = coerceNewsSources(settings);
  return {
    ...settings,
    account_mode: settings.account_mode ?? "mock",
    pending_order_policy: settings.pending_order_policy ?? "same_symbol_only",
    pending_order_cancel_after_seconds: Number(settings.pending_order_cancel_after_seconds ?? 90),
    daily_loss_limit_enabled: Boolean(settings.daily_loss_limit_enabled ?? true),
    daily_loss_limit_pct: Number(settings.daily_loss_limit_pct ?? 2.0),
    news_sources: newsSources,
    news_source: newsSources.join(","),
  };
}

function SettingsPageComponent() {
  const { refreshAll } = useTradingWorkspace();
  const [settings, setSettings] = useState<RuntimeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      setError("");
      try {
        const payload = await fetchRuntimeSettings();
        setSettings(normalizeLoadedSettings(payload.settings));
      } catch {
        setError("설정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        setLoading(false);
      }
    }

    void loadSettings();
  }, []);

  function updateSetting<K extends keyof RuntimeSettings>(key: K, value: RuntimeSettings[K]) {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
  }

  function toggleNewsSource(source: "naver" | "google" | "none") {
    setSettings((current) => {
      if (!current) return current;

      const currentSources = coerceNewsSources(current);
      let nextSources: RuntimeSettings["news_sources"];

      if (source === "none") {
        nextSources = ["none"];
      } else if (currentSources.includes(source)) {
        nextSources = normalizeNewsSources(currentSources.filter((item) => item !== source));
      } else {
        nextSources = normalizeNewsSources([...currentSources.filter((item) => item !== "none"), source]);
      }

      return {
        ...current,
        news_sources: nextSources,
        news_source: nextSources.join(","),
      };
    });
  }

  async function handleSave(applyNow: boolean) {
    if (!settings) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload: RuntimeSettingsResponse = await saveRuntimeSettings(settings, { applyNow });
      setSettings(normalizeLoadedSettings(payload.settings));
      setMessage(
        payload.message ||
          (applyNow ? "설정을 저장하고 실행 중인 런타임에 바로 반영했습니다." : "설정을 저장했습니다."),
      );
      await refreshAll();
    } catch {
      setError("설정을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="설정"
        description="모의투자와 실계좌 런타임에 사용하는 기본 옵션을 관리합니다."
        action={
          <div className="header-actions">
            <button className="secondary-button" onClick={() => void handleSave(false)} disabled={saving || !settings}>
              {saving ? "저장 중..." : "저장"}
            </button>
            <button className="refresh-button" onClick={() => void handleSave(true)} disabled={saving || !settings}>
              {saving ? "적용 중..." : "저장 후 즉시 적용"}
            </button>
          </div>
        }
      />

      {message ? <div className="banner success">{message}</div> : null}

      {loading || !settings ? (
        <EmptyState message={error || "설정을 불러오는 중입니다."} />
      ) : (
        <div className="page-grid-two settings-grid">
          <Panel title="매매 루프" subtitle="판단 방식과 반복 주기를 조정합니다.">
            <div className="form-grid">
              <label className="field">
                <span>계정 모드</span>
                <select
                  value={settings.account_mode}
                  onChange={(event) =>
                    updateSetting("account_mode", event.target.value as RuntimeSettings["account_mode"])
                  }
                >
                  {ACCOUNT_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>판단 방식</span>
                <select
                  value={settings.decision_source}
                  onChange={(event) =>
                    updateSetting("decision_source", event.target.value as RuntimeSettings["decision_source"])
                  }
                >
                  {DECISION_SOURCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>루프 프로필</span>
                <select
                  value={settings.loop_profile}
                  onChange={(event) =>
                    updateSetting("loop_profile", event.target.value as RuntimeSettings["loop_profile"])
                  }
                >
                  {LOOP_PROFILE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>미체결 주문 처리</span>
                <select
                  value={settings.pending_order_policy}
                  onChange={(event) =>
                    updateSetting(
                      "pending_order_policy",
                      event.target.value as RuntimeSettings["pending_order_policy"],
                    )
                  }
                >
                  {PENDING_ORDER_POLICY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>미체결 자동 취소 대기 초</span>
                <input
                  type="number"
                  min={0}
                  value={settings.pending_order_cancel_after_seconds}
                  onChange={(event) =>
                    updateSetting("pending_order_cancel_after_seconds", Number(event.target.value))
                  }
                />
              </label>

              <label className="field field-checkbox">
                <span>일일 손실 한도 사용</span>
                <input
                  type="checkbox"
                  checked={settings.daily_loss_limit_enabled}
                  onChange={(event) => updateSetting("daily_loss_limit_enabled", event.target.checked)}
                />
              </label>

              <label className="field">
                <span>일일 손실 한도(%)</span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={settings.daily_loss_limit_pct}
                  onChange={(event) => updateSetting("daily_loss_limit_pct", Number(event.target.value))}
                />
              </label>

              <label className="field">
                <span>반복 간격(초)</span>
                <input
                  type="number"
                  value={settings.interval_seconds}
                  onChange={(event) => updateSetting("interval_seconds", Number(event.target.value))}
                />
              </label>

              <label className="field">
                <span>반복 횟수</span>
                <input
                  type="number"
                  value={settings.iterations}
                  onChange={(event) => updateSetting("iterations", Number(event.target.value))}
                />
              </label>

              <label className="field">
                <span>장 종료 시각</span>
                <input
                  type="text"
                  placeholder="예: 15:30"
                  value={settings.market_session_end}
                  onChange={(event) => updateSetting("market_session_end", event.target.value)}
                />
              </label>
            </div>
          </Panel>

          <Panel title="시장 스캔" subtitle="후보 시장과 watchlist 크기를 조정합니다.">
            <div className="form-grid">
              <label className="field">
                <span>시세 갱신 방식</span>
                <select
                  value={settings.refresh_source}
                  onChange={(event) =>
                    updateSetting("refresh_source", event.target.value as RuntimeSettings["refresh_source"])
                  }
                >
                  {REFRESH_SOURCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>스캔 시장</span>
                <select
                  value={settings.scan_market}
                  onChange={(event) =>
                    updateSetting("scan_market", event.target.value as RuntimeSettings["scan_market"])
                  }
                >
                  {SCAN_MARKET_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>후보 수</span>
                <input
                  type="number"
                  value={settings.scan_limit}
                  onChange={(event) => updateSetting("scan_limit", Number(event.target.value))}
                />
              </label>

              <label className="field">
                <span>watchlist 크기</span>
                <input
                  type="number"
                  value={settings.watchlist_size}
                  onChange={(event) => updateSetting("watchlist_size", Number(event.target.value))}
                />
              </label>
            </div>
          </Panel>

          <Panel title="뉴스 설정" subtitle="뉴스 소스와 종목별 반영 기사 수를 조절합니다.">
            <div className="form-grid">
              <div className="field">
                <span>뉴스 소스</span>
                <div className="checkbox-group">
                  {NEWS_SOURCE_OPTIONS.map((option) => (
                    <label key={option.value} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={coerceNewsSources(settings).includes(option.value)}
                        onChange={() => toggleNewsSource(option.value)}
                      />
                      <div>
                        <strong>{option.label}</strong>
                        <small>{option.description}</small>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <label className="field">
                <span>종목별 반영 기사 수</span>
                <input
                  type="number"
                  value={settings.news_limit}
                  onChange={(event) => updateSetting("news_limit", Number(event.target.value))}
                />
              </label>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

export default memo(SettingsPageComponent);
