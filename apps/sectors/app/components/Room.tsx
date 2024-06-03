"use client";

import { trpc } from "@sectors/app/trpc";
import { useEffect, useState } from "react";
import { usePusher } from "./Pusher.context";
import { Room, RoomUser } from "@server/prisma/prisma.client";
import {
  EVENT_ROOM_JOINED,
  EVENT_ROOM_LEFT,
  getRoomChannelId,
} from "@server/pusher/pusher.types";
import { Button } from "@nextui-org/react";

const RoomComponent = ({ room }: { room: Room }) => {
  const { pusher } = usePusher();
  const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id, name, gameId } = room;

  useEffect(() => {
    const fetchRoomsAndUsers = async () => {
      try {
        const roomUsersResults = await trpc.roomUser.listRoomUsers.query({
          where: { roomId: id },
        });

        setRoomUsers(roomUsersResults);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchRoomsAndUsers();
  }, [id]);

  useEffect(() => {
    if (!pusher || loading) return;

    console.log('Subscribing to channel')
    const channel = pusher.subscribe(getRoomChannelId(id));
    channel.bind(EVENT_ROOM_JOINED, (data: RoomUser) => {
      console.log("User joined:", data);
      setRoomUsers((prev) => [...prev, data]);
    });

    channel.bind(EVENT_ROOM_LEFT, (data: RoomUser) => {
      console.log("User left:", data);
      setRoomUsers((prev) =>
        prev.filter((user) => user.userId !== data.userId)
      );
    });

    return () => {
      console.log("Unsubscribing from channel");
      channel.unbind(EVENT_ROOM_JOINED);
      channel.unbind(EVENT_ROOM_LEFT);
      channel.unsubscribe();
    };
  }, [pusher, id, loading]);

  const handleJoin = (roomId: number) => {
    trpc.roomUser.joinRoom.mutate({
      roomId,
      userId: "3a169655-aa35-47ce-b55f-6277f2e11c4a",
    });
  };

  const handleLeave = (roomId: number) => {
    trpc.roomUser.leaveRoom.mutate({
      roomId,
      userId: "3a169655-aa35-47ce-b55f-6277f2e11c4a",
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="grid grid-flow-col auto-cols-max" key={room.id}>
      {room.name}
      <div className="grid grid-flow-row auto-rows-max">
        {roomUsers.map((user) => (
          <div key={user.userId}>{user.userId}</div>
        ))}
      </div>
      <div className="grid grid-flow-row auto-rows-max">
        <Button color="primary" onClick={() => handleLeave(room.id)}>
          Leave
        </Button>
        <Button color="primary" onClick={() => handleJoin(room.id)}>
          Join
        </Button>
      </div>
    </div>
  );
};

export default RoomComponent;
