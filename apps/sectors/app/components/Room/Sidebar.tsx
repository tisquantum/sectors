"use client";

import React, { useState } from "react";
import { DistributionStrategy, OperationMechanicsVersion } from "@server/prisma/prisma.client";
import { Avatar, Tab, Tabs, Tooltip } from "@nextui-org/react";
import { trpc } from "@sectors/app/trpc";
import { useAuthUser } from "@sectors/app/components/AuthUser.context";
import GameOptions from "./GameOptions";
import ExectutiveGameOptions from "../Executives/GameOptions";
import {
  RoomUserWithUser,
  RoomWithUsersAndGames,
} from "@server/prisma/prisma.types";
import { BeakerIcon } from "@heroicons/react/24/solid";
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
  GAME_SETUP_DEFAULT_TIMERLESS,
} from "@server/data/constants";
import { RiUserUnfollowFill } from "@remixicon/react";
import {
  baseToolTipStyle,
  tooltipParagraphStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";
import { ConstructionIcon } from "lucide-react";

const constructionYellow = "#FFCC00";
interface SidebarProps {
  roomUsers: RoomUserWithUser[];
  room: RoomWithUsersAndGames;
  isSectorsGame: boolean;
  setIsSectorsGame: React.Dispatch<React.SetStateAction<boolean>>;
}

interface GameOptionsState {
  bankPoolNumber: number;
  consumerPoolNumber: number;
  startingCashOnHand: number;
  distributionStrategy: DistributionStrategy;
  gameMaxTurns: number;
  playerOrdersConcealed: boolean;
  useOptionOrders: boolean;
  useShortOrders: boolean;
  useLimitOrders: boolean;
  isTimerless: boolean;
  bots: number;
  operationMechanicsVersion?: OperationMechanicsVersion;
}

const Sidebar: React.FC<SidebarProps> = ({
  roomUsers,
  room,
  isSectorsGame,
  setIsSectorsGame,
}) => {
  const { user } = useAuthUser();
  const router = useRouter();
  const [startGameIsSubmitted, setStartGameIsSubmitted] = useState(false);
  const [isLoadingStartGame, setIsLoadingStartGame] = useState(false);
  const [loadingState, setLoadingState] = useState<Record<number, boolean>>({});
  const [gameOptions, setGameOptions] = useState<GameOptionsState>({
    bankPoolNumber: GAME_SETUP_DEFAULT_BANK_POOL_NUMBER,
    consumerPoolNumber: GAME_SETUP_DEFAULT_CONSUMER_POOL_NUMBER,
    startingCashOnHand: GAME_SETUP_DEFAULT_STARTING_CASH_ON_HAND,
    distributionStrategy: GAME_SETUP_DEFAULT_DISTRIBUTION_STRATEGY,
    gameMaxTurns: GAME_SETUP_DEFAULT_GAME_MAX_TURNS,
    playerOrdersConcealed: GAME_SETUP_DEFAULT_PLAYER_ORDERS_CONCEALED,
    useOptionOrders: false,
    useShortOrders: false,
    useLimitOrders: false,
    isTimerless: GAME_SETUP_DEFAULT_TIMERLESS,
    bots: 0,
    operationMechanicsVersion: OperationMechanicsVersion.MODERN,
  });
  const joinRoomMutation = trpc.roomUser.joinRoom.useMutation();
  const leaveRoomMutation = trpc.roomUser.leaveRoom.useMutation();
  const kickUserRoomMutation = trpc.roomUser.kickUser.useMutation();
  const startGameMutation = trpc.game.startGame.useMutation({
    onSettled: () => {
      setIsLoadingStartGame(false);
      setStartGameIsSubmitted(true);
    },
  });
  const startExecutiveGameMutation = trpc.executiveGame.startGame.useMutation({
    onSettled: () => {
      setIsLoadingStartGame(false);
      setStartGameIsSubmitted(true);
    },
  });
  const isSmallDevice = true;
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
    playerOrdersConcealed: boolean,
    useOptionOrders: boolean,
    useShortOrders: boolean,
    useLimitOrders: boolean,
    isTimerless: boolean,
    bots: number,
    operationMechanicsVersion?: OperationMechanicsVersion
  ) => {
    startGameMutation.mutate({
      roomId,
      roomName: room.name,
      startingCashOnHand,
      consumerPoolNumber,
      bankPoolNumber,
      distributionStrategy,
      gameMaxTurns,
      playerOrdersConcealed,
      useOptionOrders,
      useShortOrders,
      useLimitOrders,
      isTimerless,
      bots,
      operationMechanicsVersion,
    });
  };

  const handleExecutiveStartGame = (roomId: number, gameName: string) => {
    startExecutiveGameMutation.mutate({
      roomId,
      gameName,
    });
  };

  const handleGameOptionsChange = (options: GameOptionsState) => {
    setGameOptions(options);
  };

  const handleKickUser = (roomUser: RoomUserWithUser) => {
    setLoadingState((prev) => ({ ...prev, [roomUser.user.id]: true }));
    kickUserRoomMutation.mutate(
      {
        userId: roomUser.user.id,
        roomId: room.id,
      },
      {
        onSettled: () => {
          setLoadingState((prev) => ({ ...prev, [roomUser.user.id]: false }));
        },
      }
    );
  };

  return (
    <div className="w-full bg-gray-800 text-white p-1 lg:p-6 flex flex-col relative overflow-y-auto scrollbar">
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
              <Tabs
                onSelectionChange={(key) => {
                  setIsSectorsGame(key == "sectors");
                }}
              >
                <Tab title="Play Sectors" key="sectors">
                  <GameOptions onOptionsChange={handleGameOptionsChange} />
                </Tab>
                <Tab
                  title={
                    <div className="flex items-center space-x-2">
                      <ConstructionIcon color={constructionYellow} />
                      <span>Play The Executives</span>
                    </div>
                  }
                  key="executives"
                >
                  <ExectutiveGameOptions />
                </Tab>
              </Tabs>
            )}

            {room.game.length == 0 &&
              (startGameIsSubmitted ? (
                <div>Start Game Submitted</div>
              ) : (
                <DebounceButton
                  color="secondary"
                  onClick={() => {
                    setIsLoadingStartGame(true);
                    isSectorsGame
                      ? handleStartGame(
                          room.id,
                          gameOptions.startingCashOnHand,
                          gameOptions.consumerPoolNumber,
                          gameOptions.bankPoolNumber,
                          gameOptions.distributionStrategy,
                          gameOptions.gameMaxTurns,
                          gameOptions.playerOrdersConcealed,
                          gameOptions.useOptionOrders,
                          gameOptions.useShortOrders,
                          gameOptions.useLimitOrders,
                          gameOptions.isTimerless,
                          gameOptions.bots,
                          gameOptions.operationMechanicsVersion
                        )
                      : handleExecutiveStartGame(room.id, room.name);
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
        <div className="flex flex-col gap-2 mt-2">
          {room.game.length > 0 && (
            <Button
              color="primary"
              className="w-full"
              onClick={() => router.push(`/games/${room.game[0].id}`)}
            >
              Join Sectors Game
            </Button>
          )}
          {room.executiveGame.length > 0 && (
            <Button
              color="primary"
              className="w-full"
              onClick={() =>
                router.push(`/games/executives/${room.executiveGame[0].id}`)
              }
            >
              Join Executives Game
            </Button>
          )}
        </div>
      </div>
      <ul className="flex-1 flex flex-col">
        {roomUsers.map((roomUser) => (
          <li
            key={roomUser.user.id}
            className="flex flex-wrap items-center justify-start mb-4 gap-1"
          >
            <div className="flex items-center mr-1">
              {isSmallDevice ? (
                <UserAvatar user={roomUser.user} size="sm" />
              ) : (
                <UserAvatar user={roomUser.user} size="lg" />
              )}
            </div>
            <span className="max-w-[150px] md:max-w-[200px] lg:max-w-[250px] xl:max-w-[300px] text-xs md:text-lg lg:text-xl overflow-hidden text-ellipsis whitespace-nowrap">
              {roomUser.user.name}
            </span>
            {roomUser.roomHost && <BeakerIcon className="size-5" />}
            {room.game.length == 0 &&
              roomHostAuthUser?.roomHost &&
              !roomUser.roomHost && (
                <Tooltip
                  classNames={{ base: baseToolTipStyle }}
                  className={tooltipStyle}
                  content={<p className={tooltipParagraphStyle}>Kick User</p>}
                >
                  <div>
                    <DebounceButton
                      color="danger"
                      onClick={() => handleKickUser(roomUser)}
                      className="ml-2"
                    >
                      <RiUserUnfollowFill className="size-5" />
                    </DebounceButton>
                  </div>
                </Tooltip>
              )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
