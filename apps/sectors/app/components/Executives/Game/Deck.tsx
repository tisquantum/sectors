"use client";
import { trpc } from "@sectors/app/trpc";
import { CardStack } from "./CardStack";
import { Popover, PopoverContent, PopoverTrigger } from "@nextui-org/react";
import { CardList } from "./CardList";
import { useExecutiveGame } from "./GameContext";
import { ExecutiveCard } from "@server/prisma/prisma.client";

export const Deck = () => {
  const { gameId } = useExecutiveGame();
  const {
    data: deck,
    isLoading,
    isError,
    refetch,
  } = trpc.executiveCard.getDeck.useQuery({
    gameId,
  });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error</div>;
  }
  if (!deck) {
    return <div>No deck found</div>;
  }
  if (deck.length === 0) {
    return (
      <div className="relative border-2 border-dotted border-gray-600 rounded-lg p-4">
        <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
          DECK
        </div>
      </div>
    );
  }
  //sort deck by cardValue and cardSuit
  deck.sort((a: ExecutiveCard, b: ExecutiveCard) => {
    //sort by suit first
    if (a.cardSuit < b.cardSuit) return -1;
    if (a.cardSuit > b.cardSuit) return 1;
    //then sort by value
    if (a.cardValue < b.cardValue) return -1;
    if (a.cardValue > b.cardValue) return 1;
    return 0;
  });
  return (
    <div className="relative border-2 border-dotted border-gray-600 rounded-lg p-4">
      <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
        DECK
      </div>
      <Popover triggerType="grid" backdrop="blur">
        <PopoverTrigger>
          <div>
            <CardStack cards={deck.length} renderFull />
          </div>
        </PopoverTrigger>
        <PopoverContent>
          <CardList cards={deck} isGrid />
        </PopoverContent>
      </Popover>
    </div>
  );
};
