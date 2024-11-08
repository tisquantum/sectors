"use client";
import { trpc } from "@sectors/app/trpc";
import { CardStack } from "./CardStack";

export const Deck = () => {
  const {
    data: deck,
    isLoading,
    isError,
    refetch,
  } = trpc.executiveCard.getDeck.useQuery({
    gameId: "646882c6-74f7-4e8a-9224-f1e7fe429075",
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
  if (deck.length === 0)
    return (
      <div className="relative border-2 border-dotted border-gray-600 rounded-lg p-4">
        <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
          DECK
        </div>
      </div>
    );
  return <CardStack cards={deck} renderFull />;
};
