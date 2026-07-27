import {
  Avatar,
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";
import { Player } from "@server/prisma/prisma.client";
import { lorelei } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { useMemo } from "react";
import { hashStringToColor } from "@sectors/app/helpers";
import PlayerOverview from "./PlayerOverview";
import { useGame } from "../Game/GameContext";

/**
 * The avatar image on its own, for places that need an arbitrary pixel size or
 * cannot nest this component's popover inside another one.
 */
export function createPlayerAvatarUri(nickname: string, size: number) {
  return createAvatar(lorelei, {
    size,
    seed: nickname,
    backgroundColor: [hashStringToColor(nickname)],
  }).toDataUri();
}

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
  const avatar = useMemo(
    () => createPlayerAvatarUri(player.nickname, getSize(size)),
    [player.nickname, size]
  );
  const playerWithShares = playersWithShares.find((p) => p.id === player.id);
  return (
    <div className="flex flex-col items-center">
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
      {showNameLabel && <span>{player.nickname}</span>}
    </div>
  );
};

export default PlayerAvatar;
