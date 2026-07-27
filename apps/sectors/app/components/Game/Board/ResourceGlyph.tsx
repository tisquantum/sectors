"use client";

import { formatEnumLabel } from "@sectors/app/helpers/labels";
import { resourceColor } from "./BoardResourceColumns";

/**
 * A material as its board shape: the three global materials keep the circle,
 * square and triangle they are named for, and sector materials are diamonds.
 * Colours match the resource market so a blueprint reads against the tracks.
 */
export function ResourceGlyph({
  type,
  size = 9,
}: {
  type: string;
  size?: number;
}) {
  const base = {
    width: size,
    height: size,
    backgroundColor: resourceColor(type),
  };
  if (type === "CIRCLE") {
    return <span className="rounded-full" style={base} title={type} />;
  }
  if (type === "TRIANGLE") {
    return (
      <span
        title={type}
        style={{ ...base, clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
      />
    );
  }
  if (type === "SQUARE") {
    return <span className="rounded-[1px]" style={base} title={type} />;
  }
  return (
    <span
      title={formatEnumLabel(type)}
      className="rotate-45 rounded-[1px]"
      style={base}
    />
  );
}

export default ResourceGlyph;
