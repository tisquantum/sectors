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
import DebounceButton from "../General/DebounceButton";
import {
  GAME_SETUP_DEFAULT_BANK_POOL_NUMBER,
  GAME_SETUP_DEFAULT_CONSUMER_POOL_NUMBER,
  GAME_SETUP_DEFAULT_DISTRIBUTION_STRATEGY,
  GAME_SETUP_DEFAULT_GAME_MAX_TURNS,
  GAME_SETUP_DEFAULT_PLAYER_ORDERS_CONCEALED,
  GAME_SETUP_DEFAULT_STARTING_CASH_ON_HAND,
} from "@server/data/constants";
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
  playerOrdersConcealed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ roomUsers, room }) => {
  const { user } = useAuthUser();
  const router = useRouter();
  const [startGameIsSubmitted, setStartGameIsSubmitted] = useState(false);
  const [isLoadingStartGame, setIsLoadingStartGame] = useState(false);
  const [gameOptions, setGameOptions] = useState<GameOptionsState>({
    bankPoolNumber: GAME_SETUP_DEFAULT_BANK_POOL_NUMBER,
    consumerPoolNumber: GAME_SETUP_DEFAULT_CONSUMER_POOL_NUMBER,
    startingCashOnHand: GAME_SETUP_DEFAULT_STARTING_CASH_ON_HAND,
    distributionStrategy: GAME_SETUP_DEFAULT_DISTRIBUTION_STRATEGY,
    gameMaxTurns: GAME_SETUP_DEFAULT_GAME_MAX_TURNS,
    playerOrdersConcealed: GAME_SETUP_DEFAULT_PLAYER_ORDERS_CONCEALED,
  });
  const joinRoomMutation = trpc.roomUser.joinRoom.useMutation();
  const leaveRoomMutation = trpc.roomUser.leaveRoom.useMutation();
  const startGameMutation = trpc.game.startGame.useMutation({
    onSettled: () => {
      setIsLoadingStartGame(false);
      setStartGameIsSubmitted(true);
    },
  });

  let roomHostAuthUser: RoomUserWithUser | undefined;
  if (user && roomUsers) {
    roomHostAuthUser = roomUsers.find(
      (roomUser) => roomUser.user.id === user.id
    );
  } else {
    return null;
  }

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
    gameMaxTurns: number,
    playerOrdersConcealed: boolean
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
      playerOrdersConcealed,
    });
  };

  const handleGameOptionsChange = (options: GameOptionsState) => {
    setGameOptions(options);
  };

  return (
    <div className="w-1/4 bg-gray-800 text-white p-6 flex flex-col relative overflow-y-auto scrollbar">
      <div className="mb-6">
        {room.game.length == 0 && !roomHostAuthUser?.roomHost && (
          <Button
            color="primary"
            onClick={() => handleLeave(room.id)}
            className="mb-4 w-full"
          >
            Leave
          </Button>
        )}
        {roomHostAuthUser?.roomHost && (
          <>
            {room.game.length == 0 && (
              <GameOptions onOptionsChange={handleGameOptionsChange} />
            )}
            {room.game.length == 0 &&
              (startGameIsSubmitted ? (
                <div>Start Game Submitted</div>
              ) : (
                <DebounceButton
                  color="secondary"
                  onClick={() => {
                    setIsLoadingStartGame(true);
                    handleStartGame(
                      room.id,
                      gameOptions.startingCashOnHand,
                      gameOptions.consumerPoolNumber,
                      gameOptions.bankPoolNumber,
                      gameOptions.distributionStrategy,
                      gameOptions.gameMaxTurns,
                      gameOptions.playerOrdersConcealed
                    );
                  }}
                  radius="none"
                  className="w-full rounded-b-md"
                  isLoading={isLoadingStartGame}
                >
                  Start Game
                </DebounceButton>
              ))}
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
      <ul className="flex-1">
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
