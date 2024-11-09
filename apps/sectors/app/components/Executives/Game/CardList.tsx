import { ExecutiveCard } from "@server/prisma/prisma.client";
import PlayingCard from "./Card";

export const CardList = ({
  cards,
  isGrid,
}: {
  cards: ExecutiveCard[];
  isGrid?: boolean;
}) => (
  <div className={`${isGrid ? "grid grid-cols-5" : "flex flex-row"} gap-2`}>
    {cards.map((card) => (
      <PlayingCard
        key={card.id}
        cardNumber={card.cardValue}
        cardSuit={card.cardSuit}
      />
    ))}
  </div>
);
