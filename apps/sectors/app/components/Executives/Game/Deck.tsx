"use client";
import { trpc } from "@sectors/app/trpc";
import { CardStack } from "./CardStack";
import { Popover, PopoverContent, PopoverTrigger } from "@nextui-org/react";
import { CardList } from "./CardList";
import { useExecutiveGame } from "./GameContext";
import { ExecutiveCard } from "@server/prisma/prisma.client";
import { useEffect } from "react";

export const Deck = () => {
  const { gameId, pingCounter, currentPhase } = useExecutiveGame();
  const {
    data: deckCount,
    isLoading,
    isError,
    refetch,
  } = trpc.executiveCard.getDeckCardCount.useQuery({
    gameId,
  });
  useEffect(() => {
    refetch();
  }, [pingCounter, currentPhase?.id, refetch]);
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error</div>;
  }
  if (!deckCount) {
    return <div>No deck found</div>;
  }
  if (deckCount === 0) {
    return (
      <div className="relative border-2 border-dotted border-gray-600 rounded-lg p-4">
        <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
          DECK
        </div>
      </div>
    );
  }
  //sort deck by cardValue and cardSuit
  // deck.sort((a: ExecutiveCard, b: ExecutiveCard) => {
  //   //sort by suit first
  //   if (a.cardSuit < b.cardSuit) return -1;
  //   if (a.cardSuit > b.cardSuit) return 1;
  //   //then sort by value
  //   if (a.cardValue < b.cardValue) return -1;
  //   if (a.cardValue > b.cardValue) return 1;
  //   return 0;
  // });
  return (
    <div className="relative border-2 border-dotted border-gray-600 rounded-lg p-4">
      <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
        DECK
      </div>
      {/* <Popover triggerType="grid" backdrop="blur">
        <PopoverTrigger> */}
      <div className="pt-2">
        <CardStack cards={deckCount} />
      </div>
      {/* </PopoverTrigger>
        <PopoverContent>
          <CardList cards={deck} isGrid />
        </PopoverContent>
      </Popover> */}
    </div>
  );
};
