"use client";

import { RiListOrdered2, RiTextWrap } from "@remixicon/react";
import { useExecutiveGame } from "./GameContext";
import { friendlyPhaseName } from "../helpers";

export const GameTopBar = () => {
  const { currentTurn, currentPhase } = useExecutiveGame();
  const { name, description } = friendlyPhaseName(currentPhase?.phaseName);
  return (
    <div className="flex justify-center items-center px-6 py-3 bg-gray-900 text-white shadow-lg rounded-lg">
      <div className="flex flex-row items-center gap-3">
        <div className="flex items-center gap-2">
          <RiListOrdered2 className="text-green-400 text-xl" />
          <span className="text-lg font-semibold">
            Turn {currentTurn.turnNumber ?? "0"} of 4
          </span>
        </div>
        <div className="flex items-center gap-2 text-md font-medium">
          {/* Icon */}
          <RiTextWrap className="text-xl" />

          {/* Text Content */}
          <div className="flex flex-col">
            <span className="text-lg font-semibold">{name}</span>
            <span className="text-sm">{description}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
