import React from "react";
import { NodeInfo } from "../../core/types";

interface SelectionInfoProps {
  node: NodeInfo | null;
}

export const SelectionInfo: React.FC<SelectionInfoProps> = ({ node }) => {
  if (!node) {
    return (
      <div className="w-full py-4 px-4 rounded-3xl border border-foreground/10 bg-transparent hover:bg-foreground/5 transition-colors flex flex-row items-center justify-center gap-3 group cursor-default">
        <svg
          className="w-6 h-6 text-foreground/40 group-hover:text-foreground/80 transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        <p className="text-base text-foreground/50 group-hover:text-foreground/90 transition-colors">
          Select an element or frame in Figma
        </p>
      </div>
    );
  }

  return (
    <div className="w-full py-4 px-6 rounded-3xl border border-foreground/10 bg-foreground/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-foreground/10 px-2 py-1 text-[10px] tracking-[0.1em] uppercase font-semibold text-foreground/60">
            {node.type}
          </span>
          <span className="text-base  font-medium truncate max-w-[200px]">
            {node.name}
          </span>
        </div>
        <span className="text-xs text-foreground/40 tabular-nums">
          {node.width} × {node.height}
        </span>
      </div>
    </div>
  );
};
