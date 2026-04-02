import { memo } from "react";

type StatusPillProps = {
  online: boolean;
  label: string;
};

function StatusPillComponent({ online, label }: StatusPillProps) {
  return <span className={online ? "chip online" : "chip offline"}>{label}</span>;
}

export const StatusPill = memo(StatusPillComponent);
