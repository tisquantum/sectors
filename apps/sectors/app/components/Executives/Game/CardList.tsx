import { ExecutiveCard } from "@server/prisma/prisma.client";
import PlayingCard from "./Card";
import { ActionWrapper } from "./ActionWrapper";
import { trpc } from "@sectors/app/trpc";
import { useExecutiveGame } from "./GameContext";
import { toast } from "sonner";

export const CardList = ({
  cards,
  isGrid,
  isInteractive,
}: {
  cards: ExecutiveCard[];
  isGrid?: boolean;
  isInteractive?: boolean;
}) => {
  //TODO: Is authPlayer a safe assumption to use here for the mutation?
  const { gameId, authPlayer } = useExecutiveGame();
  if (!authPlayer) {
    return <div>Auth player not found</div>;
  }
  const playTrickMutation = trpc.executiveGame.playTrick.useMutation();
  return (
    <div className={`${isGrid ? "grid grid-cols-5" : "flex flex-row"} gap-2`}>
      {cards.map((card) => (
        <>
          {isInteractive ? (
            <ActionWrapper
              acceptCallback={() => {
                return new Promise<void>((resolve) => {
                  playTrickMutation.mutate(
                    {
                      gameId,
                      playerId: authPlayer.id,
                      cardId: card.id,
                    },
                    {
                      onSettled: () => {
                        resolve(); // Resolve the promise here
                      },
                      onError: (error) => {
                        console.error("Error playing trick: ", error);
                        toast.error("Error playing trick: " + error.message);
                      },
                    }
                  );
                });
              }}
            >
              <PlayingCard
                key={card.id}
                cardNumber={card.cardValue}
                cardSuit={card.cardSuit}
              />
            </ActionWrapper>
          ) : (
            <PlayingCard
              key={card.id}
              cardNumber={card.cardValue}
              cardSuit={card.cardSuit}
            />
          )}
        </>
      ))}
    </div>
  );
};
