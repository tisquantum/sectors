import { ExecutiveCard } from "@server/prisma/prisma.client";
import PlayingCard from "./Card";

export const CardList = ({ cards }: { cards: ExecutiveCard[] }) => (
  <div className="grid grid-cols-5 gap-2">
    {cards.map((card) => (
      <PlayingCard
        key={card.id}
        cardNumber={card.cardValue}
        cardSuit={card.cardSuit}
      />
    ))}
  </div>
);
