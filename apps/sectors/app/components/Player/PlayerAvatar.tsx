import {
  Avatar,
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from "@nextui-org/react";
import { Player } from "@server/prisma/prisma.client";
import { lorelei } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { useMemo } from "react";
import { hashStringToColor } from "@sectors/app/helpers";
import PlayerOverview from "./PlayerOverview";
import { useGame } from "../Game/GameContext";
import {
  baseToolTipStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";

const PlayerAvatar = ({
  player,
  showNameLabel,
  badgeContent,
  size = "md",
}: {
  player: Player;
  showNameLabel?: boolean;
  badgeContent?: number | string;
  size?: "sm" | "md" | "lg" | undefined;
}) => {
  const { playersWithShares } = useGame();
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
  }, []);
  const playerWithShares = playersWithShares.find((p) => p.id === player.id);
  return (
    <div className="flex flex-col items-center">
      <Tooltip
        classNames={{ base: baseToolTipStyle }}
        className={tooltipStyle}
        content={player.nickname}
      >
        <Popover placement="bottom">
          <PopoverTrigger>
            <div className="flex items-center cursor-pointer">
              {badgeContent ? (
                <Badge color="secondary" content={badgeContent}>
                  <Avatar size={size} name={player.nickname} src={avatar} />
                </Badge>
              ) : (
                <Avatar size={size} name={player.nickname} src={avatar} />
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="p-0 m-0">
            {playerWithShares && (
              <PlayerOverview playerWithShares={playerWithShares} />
            )}
          </PopoverContent>
        </Popover>
      </Tooltip>
      {showNameLabel && <span>{player.nickname}</span>}
    </div>
  );
};

export default PlayerAvatar;
