"use client";

import React, { useEffect, useState } from "react";
import { Room, User } from "@server/prisma/prisma.client";
import { Avatar, Button } from "@nextui-org/react";
import { trpc } from "@sectors/app/trpc";
import { useAuthUser } from "@sectors/app/components/AuthUser.context";
import GameOptions from "./GameOptions";
import { RoomUserWithUser } from "@server/prisma/prisma.types";
import { BeakerIcon, SunIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
interface SidebarProps {
  roomUsers: RoomUserWithUser[];
  room: Room;
}

interface GameOptionsState {
  bankPoolNumber: number;
  consumerPoolNumber: number;
  startingCashOnHand: number;
}

const Sidebar: React.FC<SidebarProps> = ({ roomUsers, room }) => {
  const { user } = useAuthUser();
  const router = useRouter();
  const [gameOptions, setGameOptions] = useState<GameOptionsState>({
    bankPoolNumber: 0,
    consumerPoolNumber: 0,
    startingCashOnHand: 0,
  });
  const joinRoomMutation = trpc.roomUser.joinRoom.useMutation();
  const leaveRoomMutation = trpc.roomUser.leaveRoom.useMutation();
  const startGameMutation = trpc.game.startGame.useMutation();

  useEffect(() => {
    console.log("gameOptions", gameOptions);
  }, [gameOptions]);

  let roomHostAuthUser: RoomUserWithUser | undefined;
  if (user && roomUsers) {
    roomHostAuthUser = roomUsers.find(
      (roomUser) => roomUser.user.id === user.id
    );
  } else {
    return null;
  }

  const handleOptionsChange = (options: GameOptionsState) => {
    setGameOptions(options);
  };

  if (!user) return null;

  const handleJoin = (roomId: number) => {
    joinRoomMutation.mutate({
      roomId,
      userId: user.id,
    });
  };

  const handleLeave = async (roomId: number) => {
    await leaveRoomMutation.mutate({
      roomId,
      userId: user.id,
    });
    router.push("/rooms");
  };

  const handleStartGame = (
    roomId: number,
    startingCashOnHand: number,
    consumerPoolNumber: number,
    bankPoolNumber: number
  ) => {
    //response happens through pusher to all clients.
    startGameMutation.mutate({
      roomId,
      startingCashOnHand,
      consumerPoolNumber,
      bankPoolNumber,
    });
  };

  const handleGameOptionsChange = (options: GameOptionsState) => {
    setGameOptions(options);
  };

  return (
    <div className="w-1/4 bg-gray-800 text-white p-6 flex flex-col">
      <div className="mb-6">
        <Button
          color="primary"
          onClick={() => handleLeave(room.id)}
          className="mb-4 w-full"
        >
          Leave
        </Button>
        {roomHostAuthUser?.roomHost && (
          <>
            <GameOptions onOptionsChange={handleGameOptionsChange} />

            <Button
              color="primary"
              onClick={() =>
                handleStartGame(
                  room.id,
                  gameOptions.startingCashOnHand,
                  gameOptions.consumerPoolNumber,
                  gameOptions.bankPoolNumber
                )
              }
              radius="none"
              className="w-full rounded-b-md"
            >
              Start Game
            </Button>
          </>
        )}
      </div>
      <ul className="flex-1 overflow-y-auto">
        {roomUsers.map((roomUser) => (
          <li key={roomUser.user.id} className="flex items-center mb-4 gap-1">
            <Avatar name={roomUser.user.name} size="sm" className="mr-2" />
            <span>{roomUser.user.name}</span>
            {roomUser.roomHost && <BeakerIcon className="size-5" />}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
