import { ExecutivePhaseName, CardSuit, CardLocation } from "@server/prisma/prisma.client";
import PlayingCard from "./Card";
import { useExecutiveGame } from "./GameContext";
import { Badge } from "@nextui-org/react";
import PlayerAvatar from "../Player/PlayerAvatar";
import { ExecutiveGameTurnWithRelations } from "@server/prisma/prisma.types";
import { trpc } from "@sectors/app/trpc";
import { useMemo } from "react";

// Helper function to determine the currently winning card (same logic as backend getTrickLeader)
const getCurrentTrickLeader = (
  trickCards: Array<{ card: { cardValue: number; cardSuit: CardSuit } }>,
  leadCardSuit: CardSuit,
  trumpCardSuit: CardSuit,
): { cardValue: number; cardSuit: CardSuit } | null => {
  if (trickCards.length === 0) return null;

  // Separate cards by trump suit and lead suit (same logic as backend)
  const trumpCards = trickCards.filter((tc) => tc.card.cardSuit === trumpCardSuit);
  const leadSuitCards = trickCards.filter(
    (tc) => tc.card.cardSuit === leadCardSuit,
  );

  // Sort trump and lead suit cards by card value (descending)
  const sortedTrumpCards = [...trumpCards].sort(
    (a, b) => b.card.cardValue - a.card.cardValue,
  );
  const sortedLeadSuitCards = [...leadSuitCards].sort(
    (a, b) => b.card.cardValue - a.card.cardValue,
  );

  // Determine the trick leader (same logic as backend)
  if (sortedTrumpCards.length > 0) {
    // If there are trump cards, the highest trump card wins
    return sortedTrumpCards[0].card;
  } else if (sortedLeadSuitCards.length > 0) {
    // If there are no trump cards, the highest lead suit card wins
    return sortedLeadSuitCards[0].card;
  } else {
    // If no trump or lead suit cards, return the highest card of any suit
    const sortedCards = [...trickCards].sort((a, b) => b.card.cardValue - a.card.cardValue);
    return sortedCards[0].card;
  }
};

export const Tricks = ({
  gameTurn,
}: {
  gameTurn: ExecutiveGameTurnWithRelations;
}) => {
  const { currentPhase, gameState, gameId } = useExecutiveGame();
  const { tricks } = gameTurn;
  const { players } = gameState;
  
  // Fetch trump card to determine winning card
  const { data: trumpCards } = trpc.executiveCard.listExecutiveCards.useQuery({
    where: {
      gameId,
      cardLocation: CardLocation.TRUMP,
    },
  }, { enabled: !!gameId });

  const trumpCardSuit = useMemo(() => {
    return trumpCards && trumpCards.length > 0 ? trumpCards[0].cardSuit : null;
  }, [trumpCards]);

  if (!tricks) {
    return <div>No tricks</div>;
  }
  if (tricks.length === 0) {
    return <div>No tricks for turn {gameTurn.turnNumber}.</div>;
  }

  // Find the current trick (the one being played, without a winner yet)
  const currentTrick = tricks.find((trick) => !trick.trickWinnerId);
  const isSelectingTrick = currentPhase?.phaseName === ExecutivePhaseName.SELECT_TRICK;

  return (
    <>
      {tricks.map((trick, index) => {
        const isCurrentTrick = trick.id === currentTrick?.id;
        const leadCard = trick.trickCards.find((tc) => tc.isLead);
        const leadCardSuit = leadCard?.card.cardSuit;

        // Calculate the currently winning card for the active trick
        let winningCard: { cardValue: number; cardSuit: CardSuit } | null = null;
        if (isCurrentTrick && isSelectingTrick && leadCardSuit && trumpCardSuit) {
          winningCard = getCurrentTrickLeader(
            trick.trickCards.map((tc) => ({
              card: tc.card,
            })),
            leadCardSuit,
            trumpCardSuit,
          );
        }

        return (
          <div key={index} className="flex flex-col gap-2">
            <div className="text-sm font-semibold">{index + 1}</div>
            <div className="flex flex-row gap-2">
              {trick.trickCards.map((card) => {
                // Find the player associated with the card
                const player = players.find(
                  (player) => player.id === card.playerId
                );

                // Determine if this card is the winner
                const isWinner = trick.trickWinnerId == player?.id;
                const isCurrentlyWinning = isCurrentTrick && 
                  isSelectingTrick && 
                  winningCard &&
                  card.card.cardValue === winningCard.cardValue &&
                  card.card.cardSuit === winningCard.cardSuit;

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
                      isBordered={isWinner}
                      isWinning={isCurrentlyWinning ?? undefined}
                    />
                  </Badge>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
};
