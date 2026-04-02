import { memo } from "react";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: "positive" | "negative" | "neutral";
};

function MetricCardComponent({ label, value, detail, tone = "neutral" }: MetricCardProps) {
  return (
    <article className={`kpi ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

export const MetricCard = memo(MetricCardComponent);
