"use client";

import { trpc } from "@sectors/app/trpc";
import { useEffect, useState } from "react";
import { usePusher } from "@sectors/app/components/Pusher.context";
import {
  Room,
  RoomUser,
  User,
} from "@server/prisma/prisma.client";
import {
  EVENT_ROOM_JOINED,
  EVENT_ROOM_LEFT,
  EVENT_ROOM_MESSAGE,
  getRoomChannelId,
} from "@server/pusher/pusher.types";
import { RoomMessageWithUser } from "@server/prisma/prisma.types";
import Sidebar from "./Sidebar";
import MessagePane from "./MessagePane";
import SendMessage from "./SendMessage";
import { useAuthUser } from "@sectors/app/components/AuthUser.context";

const RoomComponent = ({ room }: { room: Room }) => {
  const { user } = useAuthUser();
  const { pusher } = usePusher();
  const [roomUsers, setRoomUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<RoomMessageWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id, name, gameId } = room;

  useEffect(() => {
    const fetchRoomsAndUsers = async () => {
      try {
        const roomUsersResults = await trpc.roomUser.listRoomUsers.query({
          where: { roomId: id },
        });

        setRoomUsers(roomUsersResults.map((roomUser) => roomUser.user));
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchRoomsAndUsers();

    const fetchMessages = async () => {
      try {
        const messages = await trpc.roomMessage.listRoomMessages.query({
          where: { roomId: id },
        });

        const messagesWithDate: RoomMessageWithUser[] = messages.map(
          (message) => {
            return { ...message, timestamp: new Date(message.timestamp) };
          }
        );

        setMessages(messagesWithDate);
      } catch (error) {}
    };

    fetchMessages();
  }, [id]);

  useEffect(() => {
    if (!pusher || loading) return;

    console.log("Subscribing to channel");
    const channel = pusher.subscribe(getRoomChannelId(id));
    channel.bind(EVENT_ROOM_JOINED, (data: User) => {
      console.log("User joined:", data);
      setRoomUsers((prev) => [...prev, data]);
    });

    channel.bind(EVENT_ROOM_LEFT, (data: RoomUser) => {
      console.log("User left:", data);
      setRoomUsers((prev) => prev.filter((user) => user.id !== data.userId));
    });

    channel.bind(EVENT_ROOM_MESSAGE, (data: RoomMessageWithUser) => {
      console.log("Message received:", data);
      //modify data for string date to Date object
      data.timestamp = new Date(data.timestamp);
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      console.log("Unsubscribing from channel");
      channel.unbind(EVENT_ROOM_JOINED);
      channel.unbind(EVENT_ROOM_LEFT);
      channel.unsubscribe();
    };
  }, [pusher, id, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if(!user) {
    return <div>Not authenticated</div>
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const handleSendMessage = (content: string) => {
    //this data update is broadcast through a socket
    trpc.roomMessage.createRoomMessage.mutate({
      roomId: id,
      userId: user.id,
      content,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar users={roomUsers} room={room} />
      <div className="flex flex-col flex-grow bg-gray-100">
        <div className="bg-gray-800 text-white p-4">
          <h1 className="text-xl font-bold">{room.name}</h1>
        </div>
        <MessagePane messages={messages} />
        <SendMessage onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default RoomComponent;
