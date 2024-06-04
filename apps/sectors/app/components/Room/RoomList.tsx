'use client'

import React from "react";
import { AvatarGroup, Avatar, Button } from "@nextui-org/react";
import { trpc } from "@sectors/app/trpc";
import { RoomWithUser } from "@server/prisma/prisma.types";
import { useAuthUser } from "@sectors/app/components/AuthUser.context";
import { useRouter } from "next/navigation";
interface RoomListProps {
  room: RoomWithUser;
}

const RoomList: React.FC<RoomListProps> = ({ room }) => {
  const { user } = useAuthUser();
  const router = useRouter();
  if(!user) return null;

  const handleJoin = (roomId: number) => {
    trpc.roomUser.joinRoom.mutate({
      roomId,
      userId: user.id,
    });
    router.push(`/rooms/${roomId}`);
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
