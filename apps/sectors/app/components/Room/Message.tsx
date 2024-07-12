// components/Message.tsx
import React from "react";
import { Avatar, Card, CardBody, Divider } from "@nextui-org/react";
import { RoomMessageWithUser } from "@server/prisma/prisma.types";
import UserAvatar from "./UserAvatar";

interface MessageProps {
  message: RoomMessageWithUser;
}

const MessageComponent: React.FC<MessageProps> = ({ message }) => {
  return (
    <div className="mb-4">
      <Card>
        <CardBody>
          <div className="flex content-center items-center">
            <div className="items-center mr-4">
              <UserAvatar user={message.user} size="lg" />
            </div>
            <div className="flex flex-col">
              <p className="mb-2">{message.content}</p>
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
