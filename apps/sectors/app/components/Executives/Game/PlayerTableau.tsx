import { Avatar, Badge } from "@nextui-org/react";
import { RiShakeHandsFill } from "@remixicon/react";
import { CardSuit } from "@server/prisma/prisma.client";
import PlayingCard from "./Card";
import Relationship from "./Relationship";
import Influence from "./Influence";

const CardStack = ({ count }: { count: number }) => {
  return (
    <div className="flex flex-row gap-1">
      <Badge size="lg" content={count.toString()} color="secondary">
        <Avatar
          radius="md"
          size="lg"
          color="warning"
          icon={<RiShakeHandsFill />}
        />
      </Badge>
    </div>
  );
};

const Hand = () => {
  return (
    <div>
      <CardStack count={5} />
    </div>
  );
};

const Bribe = () => {
  return (
    <div>
      <PlayingCard cardNumber={10} cardSuit={CardSuit.CLUB} />
    </div>
  );
};

export const PlayerTableau = () => {
  return (
    <div className="flex flex-row gap-3">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 justify-center">
          {/* HAND Section */}
          <div className="relative border-2 border-dotted border-gray-600 rounded-lg p-4">
            <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
              HAND
            </div>
            <div className="pt-2">
              <Hand />
            </div>
          </div>

          {/* BRIBE Section */}
          <div className="relative border-2 border-dotted border-gray-600 rounded-lg p-4">
            <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
              BRIBE
            </div>
            <div className="pt-2">
              <Bribe />
            </div>
          </div>
        </div>
        <div className="flex flex-row flex-grow gap-3 justify-center items-center">
          <div className="relative border-2 border-dotted border-gray-600 rounded-lg p-4">
            <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
              RELATIONSHIPS
            </div>
            <div className="flex flex-col gap-2 items-center">
              <Relationship />
              <Relationship />
              <Relationship />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="relative border-2 border-dotted border-gray-600 rounded-lg p-4">
          <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
            GIFTS
          </div>
          <div className="flex flex-wrap gap-1">
            <PlayingCard cardNumber={2} cardSuit={CardSuit.HEART} />
            <PlayingCard cardNumber={3} cardSuit={CardSuit.CLUB} />
            <PlayingCard cardNumber={6} cardSuit={CardSuit.CLUB} isLocked />
            <PlayingCard cardNumber={4} cardSuit={CardSuit.DIAMOND} />
          </div>
        </div>
        <div className="relative border-2 border-dotted border-gray-600 rounded-lg p-4">
          <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
            INFLUENCE
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Influence influenceCount={3} />
            <Influence influenceCount={1} />
            <Influence influenceCount={6} />
          </div>
        </div>
        <div className="relative border-2 border-dotted border-gray-600 rounded-lg p-4">
          <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
            VOTES
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Influence influenceCount={2} />
            <Influence influenceCount={1} />
          </div>
        </div>
      </div>
    </div>
  );
};
