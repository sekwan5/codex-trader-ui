import { memo } from "react";

type EmptyStateProps = {
  message: string;
  compact?: boolean;
};

function EmptyStateComponent({ message, compact = false }: EmptyStateProps) {
  return <div className={`empty-state${compact ? " compact" : ""}`}>{message}</div>;
}

export const EmptyState = memo(EmptyStateComponent);
