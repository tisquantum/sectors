import { ExecutivePhaseName } from "@server/prisma/prisma.client";
import PlayingCard from "./Card";
import { useExecutiveGame } from "./GameContext";
import { Badge } from "@nextui-org/react";
import PlayerAvatar from "../Player/PlayerAvatar";
import { ExecutiveGameTurnWithRelations } from "@server/prisma/prisma.types";

export const Tricks = ({
  gameTurn,
}: {
  gameTurn: ExecutiveGameTurnWithRelations;
}) => {
  const { currentPhase, gameState } = useExecutiveGame();
  const { tricks } = gameTurn;
  const { players } = gameState;
  if (!tricks) {
    return <div>No tricks</div>;
  }
  if (tricks.length === 0) {
    return <div>No tricks for turn {gameTurn.turnNumber}.</div>;
  }
  return (
    <>
      {tricks.map((trick, index) => (
        <div key={index} className="flex flex-col gap-2">
          <div className="text-sm font-semibold">{index + 1}</div>
          <div className="flex flex-row gap-2">
            {trick.trickCards.map((card) => {
              // Find the player associated with the card
              const player = players.find(
                (player) => player.id === card.card.playerId
              );

              return (
                <Badge
                  className="top-[-1px] w-8 h-8"
                  key={card.id}
                  size="sm"
                  content={
                    player ? <PlayerAvatar player={player} size="sm" /> : null
                  }
                >
                  <PlayingCard
                    cardNumber={card.card.cardValue}
                    cardSuit={card.card.cardSuit}
                    isBordered={trick.trickWinnerId == player?.id}
                  />
                </Badge>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
};
