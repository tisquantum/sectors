// components/Message.tsx
import React from "react";
import { Avatar, Card, CardBody, Divider } from "@nextui-org/react";
import { RoomMessageWithRoomUser } from "@server/prisma/prisma.types";
import UserAvatar from "./UserAvatar";
import PlayerAvatar from "../Player/PlayerAvatar";

interface MessageProps {
  message: RoomMessageWithRoomUser;
}

const MessageComponent: React.FC<MessageProps> = ({ message }) => {
  const isUserAndPlayerNameEqual =
    message.roomUser.user.name == message.roomUser.player?.nickname;
  return (
    <div className="mb-4">
      <Card>
        <CardBody>
          <div className="flex content-center items-center">
            <div className="items-center mr-4">
              {message.roomUser.player && !!!isUserAndPlayerNameEqual ? (
                <UserAvatar
                  user={message.roomUser.user}
                  badgeContent={
                    <PlayerAvatar size="sm" player={message.roomUser.player} />
                  }
                  badgeIsOneChar={true}
                  badgePlacement="bottom-left"
                  size="lg"
                />
              ) : (
                <UserAvatar user={message.roomUser.user} size="lg" />
              )}
            </div>
            <div className="flex flex-col">
              <p className="mb-2">{message.content}</p>
              <Divider />
              <div className="flex items-center mt-2 gap-2">
                <div className="font-bold">
                  {message.roomUser.user.name}
                  {!!!isUserAndPlayerNameEqual &&
                    `(${message.roomUser.player?.nickname})`}
                </div>
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
