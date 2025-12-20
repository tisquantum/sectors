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

const PlayerAvatar = ({
  player,
  showNameLabel,
  badgeContent,
  size = "md",
}: {
  player: ExecutivePlayer;
  showNameLabel?: boolean;
  badgeContent?: number | string;
  size?: "sm" | "md" | "lg" | undefined;
}) => {
  const { currentPhase } = useExecutiveGame();
  const getSize = (size: "sm" | "md" | "lg" | undefined) => {
    switch (size) {
      case "sm":
        return 32;
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
  }, [player.nickname, size]);
  return (
    <div className="flex flex-col items-center">
      <Tooltip
        classNames={{ base: baseToolTipStyle }}
        className={tooltipStyle}
        content={player.nickname}
      >
        <div className="flex items-center">
          {badgeContent ? (
            <Badge color="secondary" content={badgeContent}>
              <Avatar
                color="success"
                isBordered={currentPhase?.activePlayerId == player.id}
                size={size}
                name={player.nickname}
                src={avatar}
              />
            </Badge>
          ) : (
            <Avatar
              color="success"
              isBordered={currentPhase?.activePlayerId == player.id}
              size={size}
              name={player.nickname}
              src={avatar}
            />
          )}
        </div>
      </Tooltip>
      {showNameLabel && <span>{player.nickname}</span>}
    </div>
  );
};

export default PlayerAvatar;
