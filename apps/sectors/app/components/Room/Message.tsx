// components/Message.tsx
import React from "react";
import { Avatar, Card, CardBody, Divider } from "@nextui-org/react";
import { RoomMessageWithUser } from "@server/prisma/prisma.types";

interface MessageProps {
  message: RoomMessageWithUser;
}

const MessageComponent: React.FC<MessageProps> = ({ message }) => {
  return (
    <div className="mb-4">
      <Card>
        <CardBody>
          <div className="flex content-center">
            <Avatar name={message.user.name} size="lg" className="mr-4" />
            <div className="flex flex-col">
              <p className="text-black mb-2">{message.content}</p>
              <Divider />
              <div className="flex items-center mt-2 gap-2">
                  <div className="font-bold">{message.user.name}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(message.timestamp).toLocaleString()}
                  </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default MessageComponent;
