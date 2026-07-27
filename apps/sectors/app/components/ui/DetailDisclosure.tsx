'use client';

import { ReactNode } from 'react';
import { RiArrowRightSLine } from '@remixicon/react';
import { cn } from '@/lib/utils';

/**
 * Collapsible detail for supporting work: formula derivations, per-item breakdowns,
 * and other content a player wants occasionally rather than constantly.
 *
 * Built on native `<details>` so it needs no state, works without JavaScript, and is
 * keyboard and screen-reader accessible for free.
 */
export function DetailDisclosure({
  summary,
  children,
  defaultOpen = false,
  className,
}: {
  /** Short label for what is hidden, e.g. "Calculation breakdown". */
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return (
    <details className={cn('group', className)} open={defaultOpen}>
      <summary
        className={cn(
          'flex items-center gap-1 cursor-pointer select-none',
          'text-xs font-medium text-gray-400 hover:text-gray-200 transition-colors',
          // Suppress the default marker so the chevron is the only affordance.
          'list-none [&::-webkit-details-marker]:hidden'
        )}
      >
        <RiArrowRightSLine
          size={14}
          className="shrink-0 transition-transform group-open:rotate-90"
        />
        {summary}
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}
