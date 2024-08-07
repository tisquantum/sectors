"use client";

import React, { useEffect, useState } from "react";
import MessagePane from "../Room/MessagePane";
import SendMessage from "../Room/SendMessage";
import {
  EVENT_ROOM_JOINED,
  EVENT_ROOM_LEFT,
  EVENT_ROOM_MESSAGE,
  getRoomChannelId,
} from "@server/pusher/pusher.types";
import {
  RoomMessageWithUser,
  RoomUserWithUser,
} from "@server/prisma/prisma.types";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";
import { useAuthUser } from "../AuthUser.context";
import { usePusher } from "../Pusher.context";
import { RoomUser } from "@server/prisma/prisma.client";
import UserAvatar from "../Room/UserAvatar";
import PlayerAvatar from "../Player/PlayerAvatar";

const GameChat = ({
  roomId,
  gameName,
}: {
  roomId: number;
  gameName: string;
}) => {
  const { currentPhase } = useGame();
  const { user } = useAuthUser();
  const { pusher } = usePusher();
  const utils = trpc.useContext();

  const { data: roomUsers, isLoading: isLoadingRoomUsers } =
    trpc.roomUser.listRoomUsers.useQuery({
      where: { roomId },
    });
  const { data: playerPriorities, refetch: refetchPlayerPriority } =
    trpc.playerPriority.listPlayerPriorities.useQuery({
      where: { gameTurnId: currentPhase?.gameTurnId },
    });

  const { data: messages, isLoading: isLoadingMessages } =
    trpc.roomMessage.listRoomMessages.useQuery({
      where: { roomId },
    });

  const createRoomMessageMutation =
    trpc.roomMessage.createRoomMessage.useMutation();

  useEffect(() => {
    refetchPlayerPriority();
  }, [currentPhase?.name]);

  useEffect(() => {
    if (!pusher) return;

    const channel = pusher.subscribe(getRoomChannelId(roomId));

    const handleRoomJoined = (data: RoomUserWithUser) => {
      utils.roomUser.listRoomUsers.setData(
        { where: { roomId } },
        (oldData: RoomUserWithUser[] | undefined) => [...(oldData || []), data]
      );
    };

    const handleRoomLeft = (data: RoomUser) => {
      utils.roomUser.listRoomUsers.setData(
        { where: { roomId } },
        (oldData: RoomUserWithUser[] | undefined) =>
          oldData?.filter((user) => user.user.id !== data.userId)
      );
    };

    const handleRoomMessage = (data: RoomMessageWithUser) => {
      utils.roomMessage.listRoomMessages.setData(
        { where: { roomId } },
        (oldData: RoomMessageWithUser[] | undefined) => [
          ...(oldData || []),
          { ...data, timestamp: new Date(data.timestamp).toISOString() },
        ]
      );
    };

    channel.bind(EVENT_ROOM_JOINED, handleRoomJoined);
    channel.bind(EVENT_ROOM_LEFT, handleRoomLeft);
    channel.bind(EVENT_ROOM_MESSAGE, handleRoomMessage);

    return () => {
      channel.unbind(EVENT_ROOM_JOINED, handleRoomJoined);
      channel.unbind(EVENT_ROOM_LEFT, handleRoomLeft);
      channel.unbind(EVENT_ROOM_MESSAGE, handleRoomMessage);
      pusher.unsubscribe(getRoomChannelId(roomId));
    };
  }, [pusher, roomId, utils]);

  if (isLoadingRoomUsers || isLoadingMessages) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Not authenticated</div>;
  }

  const handleSendMessage = (content: string) => {
    createRoomMessageMutation.mutate({
      roomId,
      userId: user.id,
      content,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="grow flex flex-col">
      <div className="text-white p-4">
        <h1 className="text-xl font-bold">{gameName}</h1>
      </div>
      <div className="flex gap-2 p-4">
        {(playerPriorities?.length || 0) > 0
          ? playerPriorities?.map((playerPriority) => (
              <div key={playerPriority.player.id}>
                <PlayerAvatar
                  player={playerPriority.player}
                  badgeContent={playerPriority.priority}
                />
              </div>
            ))
          : roomUsers?.map((roomUser) => (
              <div key={roomUser.user.id}>
                <UserAvatar user={roomUser.user} />
              </div>
            ))}
      </div>
      <div className="grow flex flex-col flex-grow bg-gray-100">
        {messages && <MessagePane messages={messages} />}
        <SendMessage onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default GameChat;
