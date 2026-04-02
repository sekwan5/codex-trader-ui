export function formatWon(value: number): string {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function formatCompactWon(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 1000000000000) {
    return `${(value / 1000000000000).toFixed(2)}조원`;
  }
  if (absolute >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억원`;
  }
  if (absolute >= 10000) {
    return `${(value / 10000).toFixed(0)}만원`;
  }
  return formatWon(value);
}

export function formatSignedWon(value: number): string {
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${prefix}${Math.abs(Math.round(value)).toLocaleString("ko-KR")}원`;
}

export function formatPct(value: number): string {
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${prefix}${Math.abs(value).toFixed(2)}%`;
}

export function shortTime(timestamp: string): string {
  return timestamp ? timestamp.slice(5, 16) : "-";
}

export function profileLabel(profile: string): string {
  if (profile === "theme") return "테마/급등";
  if (profile === "swing") return "일반 단타";
  return "초단타";
}

export function sleeveLabel(sleeve: string): string {
  return sleeve === "growth" ? "수익형" : "안정형";
}

export function metricTone(value: number): "positive" | "negative" | "neutral" {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}
