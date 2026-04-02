import type { ReactNode } from "react";
import { memo } from "react";

type PageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

function PageHeaderComponent({ title, description, action }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export const PageHeader = memo(PageHeaderComponent);
