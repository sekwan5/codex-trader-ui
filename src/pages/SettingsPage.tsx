import { memo, useEffect, useState } from "react";

import { saveRuntimeSettings, fetchRuntimeSettings } from "../api";
import { useTradingWorkspace } from "../app/TradingWorkspaceContext";
import { EmptyState } from "../components/common/EmptyState";
import { PageHeader } from "../components/common/PageHeader";
import { Panel } from "../components/common/Panel";
import type { RuntimeSettings, RuntimeSettingsResponse } from "../types";

function SettingsPageComponent() {
  const { refreshAll } = useTradingWorkspace();
  const [settings, setSettings] = useState<RuntimeSettings | null>(null);
  const [commandPreview, setCommandPreview] = useState<string[]>([]);
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
        setSettings(payload.settings);
        setCommandPreview(payload.command_preview);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "설정을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    void loadSettings();
  }, []);

  function updateSetting<K extends keyof RuntimeSettings>(key: K, value: RuntimeSettings[K]) {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
  }

  async function handleSave(applyNow: boolean) {
    if (!settings) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const payload: RuntimeSettingsResponse = await saveRuntimeSettings(settings, { applyNow });
      setSettings(payload.settings);
      setCommandPreview(payload.command_preview);
      setMessage(
        payload.message ||
          (applyNow ? "설정을 저장했고 실행 중인 런타임에 즉시 적용했습니다." : "설정을 저장했습니다."),
      );
      await refreshAll();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "설정 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="설정"
        description="런타임 시작 명령에 반영되는 기본 설정을 관리하는 화면입니다."
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
      {error ? <div className="banner error">{error}</div> : null}

      {loading || !settings ? (
        <EmptyState message="설정을 불러오는 중입니다." />
      ) : (
        <div className="page-grid-two settings-grid">
          <Panel title="매매 루프" subtitle="런타임 반복 주기와 판단 방식을 조정합니다.">
            <div className="form-grid">
              <label className="field">
                <span>판단 방식</span>
                <select
                  value={settings.decision_source}
                  onChange={(event) =>
                    updateSetting("decision_source", event.target.value as RuntimeSettings["decision_source"])
                  }
                >
                  <option value="auto">auto</option>
                  <option value="codex">codex</option>
                  <option value="sample">sample</option>
                </select>
              </label>
              <label className="field">
                <span>루프 프로필</span>
                <select
                  value={settings.loop_profile}
                  onChange={(event) => updateSetting("loop_profile", event.target.value as RuntimeSettings["loop_profile"])}
                >
                  <option value="scalp_fast">scalp_fast</option>
                  <option value="standard">standard</option>
                </select>
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

          <Panel title="시장 스캔" subtitle="후보 시장과 감시 범위를 조정합니다.">
            <div className="form-grid">
              <label className="field">
                <span>시세 갱신 방식</span>
                <select
                  value={settings.refresh_source}
                  onChange={(event) => updateSetting("refresh_source", event.target.value as RuntimeSettings["refresh_source"])}
                >
                  <option value="scan">scan</option>
                  <option value="kis">kis</option>
                  <option value="snapshot">snapshot</option>
                </select>
              </label>
              <label className="field">
                <span>스캔 시장</span>
                <select
                  value={settings.scan_market}
                  onChange={(event) => updateSetting("scan_market", event.target.value as RuntimeSettings["scan_market"])}
                >
                  <option value="all">all</option>
                  <option value="kospi">kospi</option>
                  <option value="kosdaq">kosdaq</option>
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
                <span>워치리스트 크기</span>
                <input
                  type="number"
                  value={settings.watchlist_size}
                  onChange={(event) => updateSetting("watchlist_size", Number(event.target.value))}
                />
              </label>
            </div>
          </Panel>

          <Panel title="뉴스 설정" subtitle="에이전트 판단에 사용하는 뉴스 수집 설정입니다.">
            <div className="form-grid">
              <label className="field">
                <span>뉴스 소스</span>
                <select
                  value={settings.news_source}
                  onChange={(event) => updateSetting("news_source", event.target.value as RuntimeSettings["news_source"])}
                >
                  <option value="naver">naver</option>
                  <option value="google">google</option>
                  <option value="none">none</option>
                </select>
              </label>
              <label className="field">
                <span>기사 수 제한</span>
                <input
                  type="number"
                  value={settings.news_limit}
                  onChange={(event) => updateSetting("news_limit", Number(event.target.value))}
                />
              </label>
            </div>
          </Panel>

          <Panel title="실행 미리보기" subtitle="저장 후 적용되는 실제 런타임 명령입니다.">
            <pre className="command-preview">{commandPreview.join(" ")}</pre>
            <p className="command-note">
              안전 규칙 때문에 이 명령은 항상 <code>paper</code> 브로커와 <code>--no-submit-orders</code>를 포함합니다.
            </p>
          </Panel>
        </div>
      )}
    </div>
  );
}

export default memo(SettingsPageComponent);
