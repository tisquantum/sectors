"use client";
import { useExecutiveGame } from "./GameContext";
import PlayerAvatar from "../Player/PlayerAvatar";
import { Avatar } from "@nextui-org/react";
import { ArrowDown, ArrowUp, UserMinus, UserPlus } from "lucide-react";
const Relationship = ({
  playerId,
  influenceCount,
}: {
  playerId?: string;
  influenceCount: number;
}) => {
  const { gameState } = useExecutiveGame();
  const player = playerId
    ? gameState.players.find((player) => player.id === playerId)
    : null;
  // Create an array of 3 slots, filling up with player avatars based on influenceCount
  const slots = Array.from({ length: 3 }).map((_, index) => {
    return index < influenceCount ? "filled" : "empty";
  });

  return (
    <div className="flex items-center gap-4">
      {slots.map((status, index) => (
        <div key={index} className="flex items-center relative">
          {status === "filled" && player ? (
            <PlayerAvatar size="sm" player={player} />
          ) : (
            <Avatar
              size="sm"
              icon={
                index == 2 ? <UserPlus /> : <UserMinus />
              }
            />
          )}
          {/* Show dotted line except for the last slot */}
          {index < slots.length - 1 && (
            <div className="absolute top-1/2 left-full w-10 h-0.5 bg-gray-300 dotted-line"></div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Relationship;
