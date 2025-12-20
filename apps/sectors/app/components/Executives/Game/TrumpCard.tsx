import { trpc } from "@sectors/app/trpc";
import PlayingCard from "./Card";
import { useExecutiveGame } from "./GameContext";
import { CardLocation } from "@server/prisma/prisma.client";
import { useEffect } from "react";

export const TrumpCard = ({ gameId }: { gameId: string }) => {
  const { currentPhase, pingCounter } = useExecutiveGame();
  const {
    data: trumpCard,
    isLoading,
    isError,
    refetch,
  } = trpc.executiveCard.listExecutiveCards.useQuery({
    where: {
      gameId,
      cardLocation: CardLocation.TRUMP,
    },
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
  if (!trumpCard) {
    return <div>No trump card found</div>;
  }
  if (trumpCard.length === 0) {
    return <div>No trump card found</div>;
  }
  return (
    <div className="relative border-2 border-dotted border-gray-600 rounded-lg p-4">
      <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
        TRUMP
      </div>
      <div className="pt-2">
        <PlayingCard
          cardNumber={trumpCard[0].cardValue}
          cardSuit={trumpCard[0].cardSuit}
        />
      </div>
    </div>
  );
};
