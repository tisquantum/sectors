"use client";

import { RiListOrdered2, RiTextWrap } from "@remixicon/react";
import { useExecutiveGame } from "./GameContext";
import { friendlyPhaseName } from "../helpers";
import { Popover, PopoverContent, PopoverTrigger } from "@nextui-org/react";

export const GameTopBar = () => {
  const { currentTurn, currentPhase } = useExecutiveGame();
  const { name, description } = friendlyPhaseName(currentPhase?.phaseName);
  return (
    <div className="flex justify-center items-center px-6 py-3 bg-gray-900 text-white shadow-lg rounded-lg xl:max-w-[250px]">
      <div className="flex flex-col items-center gap-3">
        <Popover>
          <PopoverTrigger>
            <div className="text-xs text-gray-200 rounded-medium bg-secondary-500 p-2 cursor-pointer">
              Points Legend
            </div>
          </PopoverTrigger>
          <PopoverContent>
            <div className="flex flex-col gap-2 p-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                <span>Agenda +4</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                <span>Relationship / +3</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                <span>Vote / +2</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                <span>Gift / +1</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <RiListOrdered2 className="text-green-400 text-xl" />
            <span className="text-lg font-semibold">
              Turn {currentTurn.turnNumber ?? "0"} of 5
            </span>
          </div>
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
