// components/RoomList.tsx
import React from "react";
import { Room, User } from "@server/prisma/prisma.client";
import { AvatarGroup, Avatar, Button } from "@nextui-org/react";
import { trpc } from "@sectors/app/trpc";
import { RoomWithUser } from "@server/prisma/prisma.types";

interface RoomListProps {
  room: RoomWithUser;
}

const RoomList: React.FC<RoomListProps> = ({ room }) => {
  const handleJoin = (roomId: number) => {
    trpc.roomUser.joinRoom.mutate({
      roomId,
      userId: "3a169655-aa35-47ce-b55f-6277f2e11c4a",
    });
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-500 rounded-lg mb-4">
      <div className="flex items-center">
        <AvatarGroup isBordered max={5}>
          {room.users &&
            room.users.length > 0 &&
            room.users.map((data) => (
              <Avatar key={data.user.id} name={data.user.name} size="sm" />
            ))}
        </AvatarGroup>
        <h2 className="ml-4 text-lg font-bold">{room.name}</h2>
      </div>
      <Button color="primary" onClick={() => handleJoin(room.id)}>
        Join
      </Button>
    </div>
  );
};

export default RoomList;
