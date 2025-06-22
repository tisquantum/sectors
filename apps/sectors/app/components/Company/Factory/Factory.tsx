"use client";

import { cn } from "@/lib/utils";
import { ResourceType } from './Factory.types';

interface FactoryProps {
  id: string;
  size: string;
  workers: number;
  consumers: number;
  resources: { type: ResourceType; price: number }[];
  isOperational: boolean;
  totalValue: number;
}

const RESOURCE_COLORS: Record<ResourceType, string> = {
  TRIANGLE: "bg-yellow-500",
  SQUARE: "bg-blue-500",
  CIRCLE: "bg-green-500",
  STAR: "bg-red-500",
  MATERIALS: "bg-gray-500",
  INDUSTRIALS: "bg-orange-500",
  CONSUMER_DISCRETIONARY: "bg-purple-500",
  CONSUMER_STAPLES: "bg-pink-500",
  CONSUMER_CYCLICAL: "bg-red-500",
  CONSUMER_DEFENSIVE: "bg-indigo-500",
  ENERGY: "bg-yellow-600",
  HEALTHCARE: "bg-teal-500",
  TECHNOLOGY: "bg-cyan-500",
  GENERAL: "bg-gray-400",
};

const ResourceShape = ({
  shape,
  color,
  title,
  price,
  size = "w-3 h-3",
}: {
  shape: string;
  color: string;
  title: string;
  price: number;
  size?: string;
}) => {
  const baseClasses = `${size} border border-gray-800/50`;
  let shapeElement;

  switch (shape) {
    case "CIRCLE":
      shapeElement = (
        <div title={title} className={cn(baseClasses, color, "rounded-full")} />
      );
      break;
    case "SQUARE":
      shapeElement = (
        <div title={title} className={cn(baseClasses, color, "rounded-sm")} />
      );
      break;
    case "TRIANGLE":
      shapeElement = (
        <div
          title={title}
          className={cn(baseClasses, color)}
          style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
        />
      );
      break;
    case "STAR":
      shapeElement = (
        <div
          title={title}
          className={cn(baseClasses, color)}
          style={{
            clipPath:
              "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
          }}
        />
      );
      break;
    default:
      shapeElement = (
        <div title={title} className={cn(baseClasses, color, "rounded-sm")} />
      );
      break;
  }

  return (
    <div className="relative group">
      {shapeElement}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10 px-2 py-1 text-xs text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {title}: ${price}
      </div>
    </div>
  );
};

export function Factory({
  id,
  size,
  workers,
  consumers,
  resources,
  isOperational,
  totalValue,
}: FactoryProps) {
  return (
    <div
      className={cn(
        "w-full rounded border-2 transition-all",
        isOperational
          ? "border-orange-400 bg-orange-400/20"
          : "border-gray-600/40 bg-gray-700/30"
      )}
    >
      {/* Factory Header */}
      <div className="flex items-center justify-between p-1 border-b border-gray-600/30">
        <div className="flex items-center gap-1">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isOperational ? "bg-orange-400" : "bg-gray-500"
            )}
          />
          <span className="text-xs font-medium text-gray-200">
            {size.split("_")[1]}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <div className="flex items-center">
            {isOperational ? (
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            ) : (
              <div className="w-1.5 h-1.5" />
            )}
          </div>
        </div>
      </div>

      {/* Resource Schematic */}
      <div className="p-1">
        <div className="flex flex-wrap gap-1 justify-center h-7 content-start">
          {resources.map((resource, index) => (
            <ResourceShape
              key={`${id}-${resource.type}-${index}`}
              shape={resource.type}
              color={RESOURCE_COLORS[resource.type]}
              title={resource.type}
              price={resource.price}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center p-1 border-b border-gray-600/30">
        <div className="text-xs font-semibold text-green-400/80">
          ${totalValue}
        </div>
      </div>

      {/* Stats */}
      <div className="px-1 pb-1 space-y-1">
        {/* Workers */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">👷</span>
          <span className="text-xs font-medium text-gray-200">{workers}</span>
        </div>

        {/* Consumers */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">👥</span>
          <span className="text-xs font-medium text-gray-200">{consumers}</span>
        </div>
      </div>
    </div>
  );
}
