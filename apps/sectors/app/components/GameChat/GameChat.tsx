"use client";

import React, { forwardRef, useEffect, useRef, useState } from "react";
import MessagePane from "../Room/MessagePane";
import SendMessage from "../Room/SendMessage";
import {
  EVENT_ROOM_JOINED,
  EVENT_ROOM_LEFT,
  EVENT_ROOM_MESSAGE,
  getRoomChannelId,
} from "@server/pusher/pusher.types";
import {
  RoomMessageWithRoomUser,
  RoomUserWithUser,
} from "@server/prisma/prisma.types";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";
import { useAuthUser } from "../AuthUser.context";
import { usePusher } from "../Pusher.context";
import { Player, RoomUser } from "@server/prisma/prisma.client";
import UserAvatar from "../Room/UserAvatar";
import PlayerAvatar from "../Player/PlayerAvatar";
import { toast } from "sonner";
interface AtListProps {
  players: Player[];
  onSelectPlayer: (player: Player) => void;
  onClose: () => void;
  showAtList: boolean;
}

const AtList = forwardRef<HTMLTextAreaElement, AtListProps>(
  ({ players, onSelectPlayer, onClose, showAtList }, sendMessageRef) => {
    const atListRef = useRef<HTMLDivElement | null>(null);
    const [atListHeight, setAtListHeight] = useState(0);
    const [caretPosition, setCaretPosition] = useState(0);
    const [sendMessageTop, setSendMessageTop] = useState(0);
    const [focusedIndex, setFocusedIndex] = useState<number>(0);

    // Get the height and position of the SendMessage component
    useEffect(() => {
      if (
        sendMessageRef &&
        "current" in sendMessageRef &&
        sendMessageRef.current
      ) {
        const rect = sendMessageRef.current.getBoundingClientRect();
        setSendMessageTop(rect.top);
      }
    }, [showAtList]);

    // Calculate the height of AtList when it mounts
    useEffect(() => {
      if (atListRef.current) {
        setAtListHeight(atListRef.current.clientHeight);
        atListRef.current.focus(); // Set focus on AtList when it mounts
      }
    }, [players.length]);

    // Close AtList if clicked outside of it
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          atListRef.current &&
          !atListRef.current.contains(event.target as Node)
        ) {
          onClose();
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [onClose]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prevIndex) => (prevIndex + 1) % players.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prevIndex) =>
          prevIndex === 0 ? players.length - 1 : prevIndex - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        onClose(); // Close the AtList
      }
    };
    console.log("atListHeight", atListHeight, sendMessageTop);
    return (
      <div
        ref={atListRef}
        tabIndex={-1} // Make the div focusable for keyboard navigation
        className="absolute bg-slate-800 border border-gray-300 shadow-lg rounded p-2"
        style={{
          top: `${sendMessageTop - atListHeight * 1.5}px`, // Align the bottom of the AtList with the top of SendMessage
          left: caretPosition,
          zIndex: 10,
          width: "200px",
          overflowY: "auto", // Enable scrolling if the content overflows
        }}
        onKeyDown={handleKeyDown}
      >
        {players?.map((player, index) => (
          <div
            key={player.id}
            className={`p-1 hover:bg-sky-700 cursor-pointer ${
              index === focusedIndex ? "bg-gray-500" : ""
            }`}
            onClick={() => onSelectPlayer(player)}
          >
            <div className="flex gap-1 items-center">
              <PlayerAvatar player={player} /> {player.nickname}
            </div>
          </div>
        ))}
      </div>
    );
  }
);

AtList.displayName = "AtList";

const GameChat = ({
  roomId,
  gameName,
}: {
  roomId: number;
  gameName: string;
}) => {
  const { gameId } = useGame();
  const { user } = useAuthUser();
  const { pusher } = usePusher();
  const [showAtList, setShowAtList] = useState(false);
  const [caretPosition, setCaretPosition] = useState(0);
  const [message, setMessage] = useState("");
  const atListRef = useRef<HTMLDivElement | null>(null);
  const sendMessageRef = useRef<HTMLTextAreaElement | null>(null);
  const [atListHeight, setAtListHeight] = useState(0);
  const { data: players, isLoading: isLoadingPlayers } =
    trpc.player.listPlayers.useQuery({
      where: { gameId },
    });
  const utils = trpc.useContext();

  const { data: messages, isLoading: isLoadingMessages } =
    trpc.roomMessage.listRoomMessages.useQuery({
      where: { roomId },
    });

  const createRoomMessageMutation =
    trpc.roomMessage.createRoomMessage.useMutation({
      onError: (error) => {
        toast.error(error.message);
      },
    });

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

    const handleRoomMessage = (data: RoomMessageWithRoomUser) => {
      utils.roomMessage.listRoomMessages.setData(
        { where: { roomId } },
        (oldData: RoomMessageWithRoomUser[] | undefined) => [
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
  if (isLoadingMessages) {
    return <div>Loading...</div>;
  }
  if (!user) {
    return <div>Not authenticated</div>;
  }
  if (isLoadingPlayers) {
    return <div>Loading Players</div>;
  }
  const handleSendMessage = (content: string) => {
    createRoomMessageMutation.mutate({
      roomId,
      userId: user.id,
      content,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSelectPlayer = (player: Player) => {
    setMessage((prevMessage) => {
      return (
        prevMessage.slice(0, caretPosition - 1) +
        `@${player.nickname} ` +
        prevMessage.slice(caretPosition)
      );
    });
    setShowAtList(false);

    // Focus back on the SendMessage input
    if (sendMessageRef.current) {
      sendMessageRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* MessagePane for displaying chat messages */}
      {messages && <MessagePane messages={messages} />}

      {/* AtList for player selection */}
      {showAtList && players && (
        <AtList
          players={players}
          onSelectPlayer={handleSelectPlayer}
          onClose={() => setShowAtList(false)}
          showAtList={showAtList}
          ref={sendMessageRef}
        />
      )}

      {/* SendMessage component fixed at the bottom */}
      <div className="sticky bottom-0 bg-background flex items-center">
        <SendMessage
          onSendMessage={handleSendMessage}
          setShowAtList={setShowAtList}
          setCaretPosition={setCaretPosition}
          controlledMessage={message}
          setControlledMessage={setMessage}
          ref={sendMessageRef}
        />
      </div>
    </div>
  );
};

export default GameChat;
