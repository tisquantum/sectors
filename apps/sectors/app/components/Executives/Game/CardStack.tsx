import {
  Avatar,
  Badge,
  Card,
  CardBody,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
} from "@nextui-org/react";
import { RiShakeHandsFill } from "@remixicon/react";
import { ExecutiveCard } from "@server/prisma/prisma.client";
import { CardList } from "./CardList";

export const CardStack = ({
  cards,
  renderFull,
}: {
  cards: ExecutiveCard[];
  renderFull?: boolean;
}) => {
  return (
    <Popover triggerType="grid" backdrop="blur">
      <PopoverTrigger>
        <div className="flex items-center justify-center cursor-pointer">
          {renderFull ? (
            <div className="relative w-[120px] h-[160px]">
              {[...Array(5)].map((_, index) => (
                <Card
                  key={index}
                  className="absolute top-[-80px] left-[-60px] bg-warning"
                  style={{
                    transform: `translate(${index * 5}px, ${index * 5}px)`,
                    zIndex: index,
                    width: "120px",
                    height: "160px",
                    borderRadius: "10px",
                  }}
                >
                  <CardBody className="flex items-center justify-center">
                    <div className="flex flex-col gap-2 text-default">
                      <RiShakeHandsFill color="default" size={24} />
                      <span className="text-lg font-semibold">
                        {cards.length}
                      </span>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            <Badge
              size="lg"
              content={cards.length.toString()}
              color="secondary"
            >
              <Avatar
                radius="md"
                size="lg"
                color="warning"
                icon={<RiShakeHandsFill />}
              />
            </Badge>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent>
        <CardList cards={cards} />
      </PopoverContent>
    </Popover>
  );
};
