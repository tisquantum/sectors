"use client";

import { useEffect } from "react";
import {
  EVENT_ROOM_JOINED,
  EVENT_ROOM_LEFT,
  EVENT_ROOM_MESSAGE,
  getRoomChannelId,
} from "@server/pusher/pusher.types";
import { useAuthUser } from "../AuthUser.context";
import { usePusher } from "../Pusher.context";
import { GLOBAL_ROOM_ID } from "@server/data/constants";
import { trpc } from "@sectors/app/trpc";
import {
  RoomMessageWithRoomUser,
  RoomUserWithUser,
} from "@server/prisma/prisma.types";
import { RoomUser } from "@server/prisma/prisma.client";
import MessagePane from "../Room/MessagePane";
import SendMessage from "../Room/SendMessage";

const GlobalChat = ({ classes }: { classes: string }) => {
  const { user } = useAuthUser();
  const { pusher } = usePusher();
  const utils = trpc.useUtils();
  const joinRoomMutation = trpc.roomUser.joinRoom.useMutation();
  const { data: messages, isLoading: isLoadingMessages } =
    trpc.roomMessage.listRoomMessages.useQuery({
      where: { roomId: GLOBAL_ROOM_ID },
    });
  const createRoomMessageMutation =
    trpc.roomMessage.createRoomMessage.useMutation();
  const {
    data: roomUsers,
    isLoading: isLoadingRoomUsers,
    status: roomUsersStatus,
    refetch: refetchRoomUsers,
  } = trpc.roomUser.listRoomUsers.useQuery({
    where: { roomId: GLOBAL_ROOM_ID },
  });
  useEffect(() => {
    if (roomUsersStatus === "success") {
      //check roomUsers for user
      const userInRoom = roomUsers?.find(
        (roomUser) => roomUser.user.id === user?.id
      );
      if (!userInRoom) {
        handleJoin(GLOBAL_ROOM_ID);
      }
    }
  }, [roomUsersStatus]);

  useEffect(() => {
    if (!pusher) return;

    const channel = pusher.subscribe(getRoomChannelId(GLOBAL_ROOM_ID));

    channel.bind(EVENT_ROOM_JOINED, (data: RoomUserWithUser) => {
      refetchRoomUsers();
    });

    channel.bind(EVENT_ROOM_LEFT, (data: RoomUser) => {
      refetchRoomUsers();
    });

    channel.bind(EVENT_ROOM_MESSAGE, (data: RoomMessageWithRoomUser) => {
      // Ensure timestamp remains a string in the cache
      handleRoomMessage(data, GLOBAL_ROOM_ID);
    });

    return () => {
      channel.unbind(EVENT_ROOM_JOINED);
      channel.unbind(EVENT_ROOM_MESSAGE);
      channel.unsubscribe();
    };
  }, [pusher, GLOBAL_ROOM_ID, isLoadingRoomUsers, isLoadingMessages]);

  const handleRoomMessage = (data: RoomMessageWithRoomUser, roomId: number) => {
    utils.roomMessage.listRoomMessages.setData(
      { where: { roomId } },
      (oldData: RoomMessageWithRoomUser[] | undefined) => [
        ...(oldData || []),
        { ...data, timestamp: new Date(data.timestamp).toISOString() },
      ]
    );
  };

  const handleJoin = (roomId: number) => {
    if (!user) return;
    joinRoomMutation.mutate({
      roomId,
      userId: user.id,
    });
  };

  if (isLoadingRoomUsers || isLoadingMessages) {
    return <div>Loading Inner Component...</div>;
  }

  if (!user) {
    return <div>Not authenticated</div>;
  }

  const handleSendMessage = (content: string) => {
    createRoomMessageMutation.mutate({
      roomId: GLOBAL_ROOM_ID,
      userId: user.id,
      content,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <>
      {user && (
        <div className={classes}>
          <div className="flex flex-col h-full">
            <h3>Global</h3>
            {/* Ensure MessagePane has scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {messages && <MessagePane messages={messages} />}
            </div>
            {/* Keep the send input properly pinned at the bottom */}
            <div className="sticky bottom-0 bg-background flex items-center">
              <SendMessage onSendMessage={handleSendMessage} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalChat;
