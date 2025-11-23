'use client';

import { cn } from '@/lib/utils';

const RESOURCE_COLORS: Record<string, string> = {
  TRIANGLE: 'bg-yellow-500',
  SQUARE: 'bg-blue-500',
  CIRCLE: 'bg-green-500',
  STAR: 'bg-red-500',
  WILDCARD: 'bg-purple-600',
  MATERIALS: 'bg-gray-500',
  INDUSTRIALS: 'bg-orange-500',
  CONSUMER_DISCRETIONARY: 'bg-purple-500',
  CONSUMER_STAPLES: 'bg-pink-500',
  CONSUMER_CYCLICAL: 'bg-red-500',
  CONSUMER_DEFENSIVE: 'bg-indigo-500',
  ENERGY: 'bg-yellow-600',
  HEALTHCARE: 'bg-teal-500',
  TECHNOLOGY: 'bg-cyan-500',
  GENERAL: 'bg-gray-400',
};

interface ResourceIconProps {
  resourceType: string;
  size?: string;
  title?: string;
}

export function ResourceIcon({ resourceType, size = "w-4 h-4", title }: ResourceIconProps) {
  const color = RESOURCE_COLORS[resourceType] || 'bg-gray-500';
  const displayTitle = title || resourceType;

  const baseClasses = `${size} border border-gray-800/50`;
  let shapeElement;

  switch (resourceType) {
    case "CIRCLE":
      shapeElement = (
        <div title={displayTitle} className={cn(baseClasses, color, "rounded-full")} />
      );
      break;
    case "SQUARE":
      shapeElement = (
        <div title={displayTitle} className={cn(baseClasses, color, "rounded-sm")} />
      );
      break;
    case "TRIANGLE":
      shapeElement = (
        <div
          title={displayTitle}
          className={cn(baseClasses, color)}
          style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
        />
      );
      break;
    case "STAR":
      shapeElement = (
        <div
          title={displayTitle}
          className={cn(baseClasses, color)}
          style={{
            clipPath:
              "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
          }}
        />
      );
      break;
    case "WILDCARD":
      shapeElement = (
        <div
          title={displayTitle}
          className={cn(baseClasses, color, "rounded-full relative")}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-xs font-bold">★</span>
          </div>
        </div>
      );
      break;
    default:
      shapeElement = (
        <div title={displayTitle} className={cn(baseClasses, color, "rounded-sm")} />
      );
      break;
  }

  return (
    <div className="relative group">
      {shapeElement}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10 px-2 py-1 text-xs text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {displayTitle}
      </div>
    </div>
  );
} 