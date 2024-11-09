import { Avatar, Badge, Card, CardBody } from "@nextui-org/react";
import { RiShakeHandsFill } from "@remixicon/react";
import { ExecutiveCard } from "@server/prisma/prisma.client";

export const CardStack = ({
  cards,
  renderFull,
}: {
  cards: number;
  renderFull?: boolean;
}) => {
  return (
    <div className="flex items-center justify-center cursor-pointer">
      {renderFull ? (
        <div className="relative w-[120px] h-[160px]">
          {[...Array(5)].map((_, index) => (
            <Card
              key={index}
              className="absolute top-0 left-0 bg-warning"
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
                  <span className="text-lg font-semibold">{cards}</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <Badge size="lg" content={cards} color="secondary">
          <Avatar
            radius="md"
            size="lg"
            color="warning"
            icon={<RiShakeHandsFill />}
          />
        </Badge>
      )}
    </div>
  );
};
