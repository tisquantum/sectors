"use client";

import React, { useEffect, useState } from "react";
import { DistributionStrategy, Room, User } from "@server/prisma/prisma.client";
import { Avatar } from "@nextui-org/react";
import { trpc } from "@sectors/app/trpc";
import { useAuthUser } from "@sectors/app/components/AuthUser.context";
import GameOptions from "./GameOptions";
import {
  RoomUserWithUser,
  RoomWithUsersAndGames,
} from "@server/prisma/prisma.types";
import { BeakerIcon, SunIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import UserAvatar from "./UserAvatar";
import Button from "../General/DebounceButton";
interface SidebarProps {
  roomUsers: RoomUserWithUser[];
  room: RoomWithUsersAndGames;
}

interface GameOptionsState {
  bankPoolNumber: number;
  consumerPoolNumber: number;
  startingCashOnHand: number;
  distributionStrategy: DistributionStrategy;
  gameMaxTurns: number;
}

const Sidebar: React.FC<SidebarProps> = ({ roomUsers, room }) => {
  const { user } = useAuthUser();
  const router = useRouter();
  const [gameOptions, setGameOptions] = useState<GameOptionsState>({
    bankPoolNumber: 12000,
    consumerPoolNumber: 75,
    startingCashOnHand: 300,
    distributionStrategy: DistributionStrategy.BID_PRIORITY,
    gameMaxTurns: 15,
  });
  const joinRoomMutation = trpc.roomUser.joinRoom.useMutation();
  const leaveRoomMutation = trpc.roomUser.leaveRoom.useMutation();
  const startGameMutation = trpc.game.startGame.useMutation();

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
    bankPoolNumber: number,
    distributionStrategy: DistributionStrategy,
    gameMaxTurns: number
  ) => {
    //response happens through pusher to all clients.
    startGameMutation.mutate({
      roomId,
      roomName: room.name,
      startingCashOnHand,
      consumerPoolNumber,
      bankPoolNumber,
      distributionStrategy,
      gameMaxTurns,
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
            <GameOptions
              initialBankPoolNumber={12000}
              initialConsumerPoolNumber={75}
              initialStartingCashOnHand={300}
              initialDistributionStrategy={DistributionStrategy.BID_PRIORITY}
              initialGameMaxTurns={15}
              onOptionsChange={handleGameOptionsChange}
            />
            {room.game.length == 0 && (
              <Button
                color="primary"
                onClick={() =>
                  handleStartGame(
                    room.id,
                    gameOptions.startingCashOnHand,
                    gameOptions.consumerPoolNumber,
                    gameOptions.bankPoolNumber,
                    gameOptions.distributionStrategy,
                    gameOptions.gameMaxTurns
                  )
                }
                radius="none"
                className="w-full rounded-b-md"
              >
                Start Game
              </Button>
            )}
          </>
        )}
        {room.game.length > 0 && (
          <Button
            color="primary"
            className="w-full"
            onClick={() => router.push(`/games/${room.game[0].id}`)}
          >
            Join Game In Progress
          </Button>
        )}
      </div>
      <ul className="flex-1 overflow-y-auto">
        {roomUsers.map((roomUser) => (
          <li key={roomUser.user.id} className="flex items-center mb-4 gap-1">
            <div className="flex items-center mr-1">
              <UserAvatar user={roomUser.user} size="lg" />
            </div>
            <span className="text-xl">{roomUser.user.name}</span>
            {roomUser.roomHost && <BeakerIcon className="size-5" />}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
