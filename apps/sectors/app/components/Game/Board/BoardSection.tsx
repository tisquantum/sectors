"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { FocusLevel } from "./boardFocus";

/**
 * Panel chrome shared by every region of the board. The focus level drives how
 * loudly the panel presents itself so a glance is enough to find the live area.
 */
export function BoardSection({
  title,
  hint,
  focus = "idle",
  actions,
  children,
  className,
  bodyClassName,
}: {
  title: ReactNode;
  hint?: ReactNode;
  focus?: FocusLevel;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "relative flex min-w-0 flex-col rounded-lg border bg-zinc-950/70 transition-colors duration-500",
        focus === "primary" &&
          "border-sky-500/70 bg-sky-950/20 shadow-[0_0_0_1px_rgba(56,189,248,0.25),0_0_28px_-8px_rgba(56,189,248,0.55)]",
        focus === "secondary" && "border-zinc-700 bg-zinc-900/60",
        focus === "idle" && "border-zinc-800/80",
        className
      )}
    >
      <header className="flex items-center gap-2 border-b border-zinc-800/70 px-2 py-1">
        <h2
          className={cn(
            "shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em]",
            focus === "primary" ? "text-sky-300" : "text-zinc-500"
          )}
        >
          {title}
        </h2>
        {hint && (
          <span className="min-w-0 truncate text-[10px] text-zinc-600">
            {hint}
          </span>
        )}
        {focus === "primary" && (
          <span className="ml-auto flex shrink-0 items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-sky-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
            Live
          </span>
        )}
        {actions && <div className="ml-auto flex shrink-0 items-center gap-1">{actions}</div>}
      </header>
      <div className={cn("min-h-0 min-w-0 flex-1 p-2", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

/** Small pressable statistic used across the board; opens detail on press. */
export function BoardStat({
  label,
  value,
  accent,
  onPress,
  className,
}: {
  label: string;
  value: ReactNode;
  accent?: string;
  onPress?: () => void;
  className?: string;
}) {
  const Tag = onPress ? "button" : "div";
  return (
    <Tag
      type={onPress ? "button" : undefined}
      onClick={onPress}
      className={cn(
        "flex flex-col items-start rounded-md border border-zinc-800 bg-zinc-900/70 px-2 py-1 text-left leading-tight",
        onPress && "transition-colors hover:border-zinc-600 hover:bg-zinc-800/80",
        className
      )}
    >
      <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <span
        className="text-sm font-bold tabular-nums"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </span>
    </Tag>
  );
}
