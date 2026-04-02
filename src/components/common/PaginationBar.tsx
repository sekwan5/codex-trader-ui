import { memo } from "react";

import type { Pagination } from "../../types";

type PaginationProps = {
  pagination: Pagination | null;
  onPageChange: (page: number) => void;
};

function PaginationBarComponent({ pagination, onPageChange }: PaginationProps) {
  if (!pagination || pagination.total_items === 0) return null;
  return (
    <div className="pagination">
      <button disabled={!pagination.has_prev} onClick={() => onPageChange(pagination.page - 1)}>
        이전
      </button>
      <span>
        {pagination.page} / {pagination.total_pages}
      </span>
      <button disabled={!pagination.has_next} onClick={() => onPageChange(pagination.page + 1)}>
        다음
      </button>
    </div>
  );
}

export const PaginationBar = memo(PaginationBarComponent);
