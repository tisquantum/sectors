'use client';

import { ReactNode } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@nextui-org/react';
import { cn } from '@/lib/utils';

export type StatTone =
  | 'neutral'
  | 'positive'
  | 'caution'
  | 'danger'
  | 'brand'
  | 'research'
  | 'trait';

const TONE_CLASSES: Record<StatTone, string> = {
  neutral: 'border-gray-600/70 bg-gray-700/40 text-gray-100',
  positive: 'border-emerald-500/40 bg-emerald-950/35 text-emerald-50',
  caution: 'border-amber-500/40 bg-amber-950/35 text-amber-50',
  danger: 'border-red-500/40 bg-red-950/35 text-red-50',
  brand: 'border-purple-400/45 bg-purple-500/15 text-purple-50',
  research: 'border-cyan-500/40 bg-cyan-950/35 text-cyan-50',
  trait: 'border-emerald-500/35 bg-emerald-950/35 text-emerald-50',
};

const TONE_HOVER: Record<StatTone, string> = {
  neutral: 'hover:bg-gray-700/70',
  positive: 'hover:bg-emerald-900/45',
  caution: 'hover:bg-amber-900/45',
  danger: 'hover:bg-red-900/45',
  brand: 'hover:bg-purple-500/25',
  research: 'hover:bg-cyan-900/45',
  trait: 'hover:bg-emerald-900/45',
};

const SIZE_CLASSES = {
  sm: 'gap-1 px-1.5 py-0.5 text-xs',
  md: 'gap-1.5 px-2 py-1 text-sm',
  lg: 'gap-1.5 px-2.5 py-1 text-base',
} as const;

export interface StatChipProps {
  /** Human-readable name of the stat. Used as the popover heading and accessible name. */
  label: string;
  value?: ReactNode;
  icon?: ReactNode;
  /** Explanation shown when the chip is opened. Giving this makes the chip interactive. */
  help?: ReactNode;
  /** Rendered below the help text, for charts or follow-on actions. */
  helpExtra?: ReactNode;
  tone?: StatTone;
  size?: keyof typeof SIZE_CLASSES;
  /** Show the label beside the value instead of only inside the popover. */
  showLabel?: boolean;
  className?: string;
  /** Inline style escape hatch for sector colours, which are data-driven hex values. */
  style?: React.CSSProperties;
}

/**
 * A single labelled game statistic.
 *
 * The chip itself is the disclosure trigger, so an explanation costs no extra visual
 * element. Screens here show a dozen or more stats side by side, and giving each one its
 * own separate info button doubles the number of things competing for attention.
 */
export function StatChip({
  label,
  value,
  icon,
  help,
  helpExtra,
  tone = 'neutral',
  size = 'md',
  showLabel = false,
  className,
  style,
}: StatChipProps) {
  const body = (
    <>
      {icon}
      {showLabel && (
        <span className="text-current/70 font-normal">{label}</span>
      )}
      {value !== undefined && (
        <span className="font-medium tabular-nums">{value}</span>
      )}
    </>
  );

  const shape = cn(
    'inline-flex items-center rounded-md border shrink-0',
    SIZE_CLASSES[size],
    TONE_CLASSES[tone],
    className
  );

  if (!help && !helpExtra) {
    return (
      <span className={shape} style={style} title={label}>
        {body}
      </span>
    );
  }

  return (
    <Popover placement="top" showArrow>
      <PopoverTrigger>
        <button
          type="button"
          className={cn(shape, TONE_HOVER[tone], 'transition-colors cursor-pointer')}
          style={style}
          aria-label={`${label}${value !== undefined ? `: ${String(value)}` : ''}. Show details`}
        >
          {body}
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-w-xs">
        <div className="px-1 py-1">
          <div className="text-small font-semibold mb-1 flex items-center gap-2">
            {icon}
            {label}
          </div>
          {help && <div className="text-small text-default-500">{help}</div>}
          {helpExtra && <div className="mt-2">{helpExtra}</div>}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Wrapper that keeps a run of chips on a consistent baseline and wrap rhythm.
 */
export function StatChipRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1.5 flex-wrap', className)}>
      {children}
    </div>
  );
}
