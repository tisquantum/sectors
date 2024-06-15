"use client";

import { trpc } from "@sectors/app/trpc";
import { useEffect, useState } from "react";
import { usePusher } from "@sectors/app/components/Pusher.context";
import { Room, RoomUser, User } from "@server/prisma/prisma.client";
import {
  EVENT_GAME_STARTED,
  EVENT_ROOM_JOINED,
  EVENT_ROOM_LEFT,
  EVENT_ROOM_MESSAGE,
  getRoomChannelId,
} from "@server/pusher/pusher.types";
import {
  RoomMessageWithUser,
  RoomUserWithUser,
} from "@server/prisma/prisma.types";
import Sidebar from "./Sidebar";
import MessagePane from "./MessagePane";
import SendMessage from "./SendMessage";
import { useAuthUser } from "@sectors/app/components/AuthUser.context";
import CountdownModal from "../Modal/CountdownModal";
import { useRouter } from "next/navigation";

const RoomComponent = ({ room }: { room: Room }) => {
  const { user } = useAuthUser();
  const { pusher } = usePusher();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const { id } = room;

  const { data: roomUsers, isLoading: isLoadingRoomUsers } =
    trpc.roomUser.listRoomUsers.useQuery({
      where: { roomId: id },
    });

  const { data: messages, isLoading: isLoadingMessages } =
    trpc.roomMessage.listRoomMessages.useQuery({
      where: { roomId: id },
    });

  const createRoomMessageMutation =
    trpc.roomMessage.createRoomMessage.useMutation();

  useEffect(() => {
    if (!pusher) return;

    console.log("Subscribing to channel");
    const channel = pusher.subscribe(getRoomChannelId(id));

    channel.bind(EVENT_ROOM_JOINED, (data: RoomUserWithUser) => {
      console.log("User joined:", data);
      utils.roomUser.listRoomUsers.setData(
        {},
        (oldData: RoomUserWithUser[] | undefined) => [...(oldData || []), data]
      );
    });

    channel.bind(EVENT_ROOM_LEFT, (data: RoomUser) => {
      console.log("User left:", data);
      utils.roomUser.listRoomUsers.setData(
        {},
        (oldData: RoomUserWithUser[] | undefined) =>
          oldData?.filter((user) => user.user.id !== data.userId)
      );
    });

    channel.bind(EVENT_ROOM_MESSAGE, (data: RoomMessageWithUser) => {
      console.log("Message received:", data);
      // Ensure timestamp remains a string in the cache
      utils.roomMessage.listRoomMessages.setData(
        { where: { roomId: id } },
        (oldData: RoomMessageWithUser[] | undefined) => [
          ...(oldData || []),
          { ...data, timestamp: new Date(data.timestamp).toISOString() }, // Keep as string
        ]
      );
    });

    channel.bind(EVENT_GAME_STARTED, (data: { gameId: string }) => {
      console.log("Game started");
      setIsOpen(true);
      setGameId(data.gameId);
    });

    return () => {
      console.log("Unsubscribing from channel");
      channel.unbind(EVENT_ROOM_JOINED);
      channel.unbind(EVENT_ROOM_LEFT);
      channel.unbind(EVENT_ROOM_MESSAGE);
      channel.unbind(EVENT_GAME_STARTED);
      channel.unsubscribe();
    };
  }, [pusher, id, isLoadingRoomUsers, isLoadingMessages]);

  if (isLoadingRoomUsers || isLoadingMessages) {
    return <div>Loading Inner Component...</div>;
  }

  if (!user) {
    return <div>Not authenticated</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const handleSendMessage = (content: string) => {
    createRoomMessageMutation.mutate({
      roomId: id,
      userId: user.id,
      content,
      timestamp: new Date().toISOString(),
    });
  };

  const handleGameStart = () => {
    router.push(`/games/${gameId}`);
  };

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        {roomUsers && <Sidebar roomUsers={roomUsers} room={room} />}
        <div className="flex flex-col flex-grow bg-gray-100">
          <div className="bg-gray-800 text-white p-4">
            <h1 className="text-xl font-bold">{room.name}</h1>
          </div>
          {messages && <MessagePane messages={messages} />}
          <SendMessage onSendMessage={handleSendMessage} />
        </div>
      </div>
      <CountdownModal
        title={"Game Started"}
        countdownTime={5}
        countdownCallback={handleGameStart}
        isOpen={isOpen}
      />
    </>
  );
};

export default RoomComponent;
