import { cn } from '@/lib/utils';

const RESOURCE_COLORS: Record<string, string> = {
  TRIANGLE: 'bg-yellow-500',
  SQUARE: 'bg-blue-500',
  CIRCLE: 'bg-green-500',
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

export function ResourceIcon({ type, label }: { type: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn('inline-block w-4 h-4 rounded', RESOURCE_COLORS[type])} />
      <span>{label}</span>
    </span>
  );
} 