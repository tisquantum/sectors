import { Avatar } from "@nextui-org/react";
import { RiLock2Fill } from "@remixicon/react";
import { CardSuit } from "@server/prisma/prisma.client";
import { ClubIcon, DiamondIcon, HeartIcon, SpadeIcon } from "lucide-react";

const PlayingCard = ({
  cardNumber,
  cardSuit,
  isLocked,
  isBordered
}: {
  cardNumber: number;
  cardSuit: CardSuit;
  isLocked?: boolean;
  isBordered?: boolean;
}) => {
  const renderColorBySuit = (cardSuit: CardSuit) => {
    switch (cardSuit) {
      case CardSuit.SPADE:
        return "default";
      case CardSuit.CLUB:
        return "default";
      case CardSuit.DIAMOND:
        return "danger";
      case CardSuit.HEART:
        return "danger";
      default:
        return "default";
    }
  };
  const renderSuit = (cardSuit: CardSuit) => {
    switch (cardSuit) {
      case CardSuit.SPADE:
        return <SpadeIcon fill="white" size={24} />;
      case CardSuit.CLUB:
        return <ClubIcon fill="white" size={24} />;
      case CardSuit.DIAMOND:
        return <DiamondIcon fill="white" size={24} />;
      case CardSuit.HEART:
        return <HeartIcon fill="white" size={24} />;
      default:
        return "";
    }
  };
  return (
    <Avatar
      isBordered={isBordered}
      radius="md"
      size="lg"
      color={renderColorBySuit(cardSuit)}
      icon={
        <div className="relative flex items-center justify-center">
          {/* Locked effect */}
          {isLocked && (
            <div className="absolute inset-0 bg-black opacity-50 rounded-lg transition-opacity duration-300" />
          )}
          <div
            className={`flex flex-row items-center gap-1 text-xl ${
              isLocked ? "opacity-30" : "opacity-100"
            }`}
          >
            {renderSuit(cardSuit)}
            {cardNumber}
          </div>
          {/* Lock icon */}
          {isLocked && (
            <RiLock2Fill color="yellow" className="absolute top-2 right-2 text-lg" />
          )}
        </div>
      }
    />
  );
};

export default PlayingCard;
