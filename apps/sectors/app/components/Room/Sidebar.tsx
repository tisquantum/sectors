"use client";

import React, { useState } from "react";
import { Room, User } from "@server/prisma/prisma.client";
import { Avatar, Button } from "@nextui-org/react";
import { trpc } from "@sectors/app/trpc";
import { useAuthUser } from "@sectors/app/components/AuthUser.context";
import GameOptions from "./GameOptions";
interface SidebarProps {
  users: User[];
  room: Room;
}

interface GameOptionsState {
  bankPoolNumber: number;
  consumerPoolNumber: number;
  startingCashOnHand: number;
}

const Sidebar: React.FC<SidebarProps> = ({ users, room }) => {
  const { user } = useAuthUser();
  const [gameOptions, setGameOptions] = useState<GameOptionsState>({
    bankPoolNumber: 0,
    consumerPoolNumber: 0,
    startingCashOnHand: 0,
  });

  const handleOptionsChange = (options: GameOptionsState) => {
    setGameOptions(options);
  };

  if (!user) return null;

  const handleJoin = (roomId: number) => {
    trpc.roomUser.joinRoom.mutate({
      roomId,
      userId: user.id,
    });
  };

  const handleLeave = (roomId: number) => {
    trpc.roomUser.leaveRoom.mutate({
      roomId,
      userId: user.id,
    });
  };

  const handleStartGame = (
    roomId: number,
    startingCashOnHand: number,
    consumerPoolNumber: number,
    bankPoolNumber: number
  ) => {
    trpc.game.startGame.mutate({
      roomId,
      startingCashOnHand,
      consumerPoolNumber,
      bankPoolNumber,
    });
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
        <GameOptions />
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
      </div>
      <ul className="flex-1 overflow-y-auto">
        {users.map((user) => (
          <li key={user.id} className="flex items-center mb-4">
            <Avatar name={user.name} size="sm" className="mr-2" />
            <span>{user.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
