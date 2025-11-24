import { Avatar } from "@nextui-org/react";
import { RiLock2Fill, RiStarFill } from "@remixicon/react";
import { CardSuit } from "@server/prisma/prisma.client";
import { ClubIcon, DiamondIcon, HeartIcon, SpadeIcon } from "lucide-react";

const PlayingCard = ({
  cardNumber,
  cardSuit,
  isLocked,
  isBordered,
  isWinning,
  isLead,
}: {
  cardNumber: number;
  cardSuit: CardSuit;
  isLocked?: boolean;
  isBordered?: boolean;
  isWinning?: boolean;
  isLead?: boolean;
}) => {
  const suitIcon = {
    [CardSuit.SPADE]: <SpadeIcon fill="white" size={24} />,
    [CardSuit.CLUB]: <ClubIcon fill="white" size={24} />,
    [CardSuit.DIAMOND]: <DiamondIcon fill="white" size={24} />,
    [CardSuit.HEART]: <HeartIcon fill="white" size={24} />,
  }[cardSuit];

  const color = ["SPADE", "CLUB"].includes(cardSuit) ? "default" : "danger";

  // Determine border styling - winning card gets a more prominent highlight
  const borderClass = isWinning
    ? "border-4 border-yellow-400 shadow-lg shadow-yellow-400/50 ring-2 ring-yellow-300"
    : isBordered
    ? "border-2 border-gray-400"
    : "";

  return (
    <div
      className={`relative flex items-center justify-center w-14 h-14 rounded-medium transition-all duration-300 ${
        borderClass
      } ${color === "danger" ? "bg-red-600" : "bg-gray-800"} ${
        isWinning ? "scale-110 z-10" : ""
      }`}
    >
      {/* Locked effect */}
      {isLocked && (
        <div className="absolute inset-0 bg-black opacity-50 rounded-lg transition-opacity duration-300" />
      )}
      <div
        className={`flex flex-row items-center gap-1 text-xl text-white ${
          isLocked ? "opacity-30" : "opacity-100"
        }`}
      >
        {suitIcon}
        <span>{cardNumber}</span>
      </div>
      {/* Lock icon */}
      {isLocked && (
        <RiLock2Fill
          color="yellow"
          className="absolute top-2 right-2 text-lg"
        />
      )}
      {/* Lead card indicator */}
      {isLead && (
        <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5 shadow-lg">
          <RiStarFill
            color="white"
            className="text-xs"
            size={12}
          />
        </div>
      )}
    </div>
  );
};

export default PlayingCard;
