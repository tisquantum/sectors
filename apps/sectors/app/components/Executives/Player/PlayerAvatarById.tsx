import {
  Avatar,
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from "@nextui-org/react";
import { ExecutivePlayer, Player } from "@server/prisma/prisma.client";
import { lorelei } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { useMemo } from "react";
import { hashStringToColor } from "@sectors/app/helpers";
import {
  baseToolTipStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";
import { useExecutiveGame } from "../Game/GameContext";

export const PlayerAvatarById = ({
  playerId,
  size = "md",
}: {
  playerId: string;
  size?: "sm" | "md" | "lg" | undefined;
}) => {
  const { currentPhase, gameState } = useExecutiveGame();
  const { players } = gameState;
  if (!players) {
    return <div>Players not found</div>;
  }
  const player = players.find((p) => p.id === playerId);
  if (!player) {
    return <div>Player not found</div>;
  }
  const getSize = (size: "sm" | "md" | "lg" | undefined) => {
    switch (size) {
      case "sm":
        return 12;
      case "md":
        return 64;
      case "lg":
        return 128;
      default:
        return 128;
    }
  };
  const avatar = useMemo(() => {
    return createAvatar(lorelei, {
      size: getSize(size),
      seed: player.nickname,
      backgroundColor: [hashStringToColor(player.nickname)],
    }).toDataUri();
  }, []);
  return (
    <div className="flex flex-col items-center">
      <Tooltip
        classNames={{ base: baseToolTipStyle }}
        className={tooltipStyle}
        content={player.nickname}
      >
        <div className="flex items-center">
          <Avatar
            className="h-6 w-6"
            color="success"
            isBordered={currentPhase?.activePlayerId == player.id}
            name={player.nickname}
            src={avatar}
          />
        </div>
      </Tooltip>
    </div>
  );
};
