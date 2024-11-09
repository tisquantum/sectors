import { Avatar, Badge } from "@nextui-org/react";
import { ExecutivePlayer } from "@server/prisma/prisma.client";
import PlayerAvatar from "../Player/PlayerAvatar";
import { useExecutiveGame } from "./GameContext";

const Influence = ({
  influenceCount,
  playerId,
}: {
  influenceCount: number;
  playerId: string;
}) => {
  const { gameState } = useExecutiveGame();
  const player = gameState.players.find((p) => p.id === playerId) as ExecutivePlayer;
  if (!player) {
    return <div>Player not found</div>;
  }
  return (
    <PlayerAvatar size={"sm"} player={player} badgeContent={influenceCount.toString()} />
  );
};

export default Influence;
