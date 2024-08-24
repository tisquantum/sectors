"use client";

import React from "react";
import { AvatarGroup, Avatar, Chip } from "@nextui-org/react";
import { trpc } from "@sectors/app/trpc";
import { RoomWithUsersAndGames } from "@server/prisma/prisma.types";
import { useAuthUser } from "@sectors/app/components/AuthUser.context";
import { useRouter } from "next/navigation";
import Button from "@sectors/app/components/General/DebounceButton";
import UserAvatar from "./UserAvatar";
import { GameStatus } from "@server/prisma/prisma.client";
import { renderGameStatusColor } from "@sectors/app/helpers";
interface RoomListProps {
  room: RoomWithUsersAndGames;
}

const RoomListItem: React.FC<RoomListProps> = ({ room }) => {
  const { user } = useAuthUser();
  const router = useRouter();
  const joinRoomMutation = trpc.roomUser.joinRoom.useMutation();
  if (!user) return null;

  const handleJoin = (roomId: number) => {
    joinRoomMutation.mutate({
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
              <UserAvatar key={data.user.id} user={data.user} size="sm" />
            ))}
        </AvatarGroup>
        <h2 className="ml-4 text-lg font-bold">{room.name}</h2>
        <Chip
          color={renderGameStatusColor(room.game?.[0]?.gameStatus)}
          className="ml-4"
        >
          {room.game?.[0]?.gameStatus || GameStatus.PENDING}
        </Chip>
      </div>
      <Button color="primary" onClick={() => handleJoin(room.id)}>
        Join
      </Button>
    </div>
  );
};

export default RoomListItem;
