import { memo } from "react";

function LoadingBlockComponent() {
  return <div className="empty-state">불러오는 중입니다.</div>;
}

export const LoadingBlock = memo(LoadingBlockComponent);
