"use client";

import React from "react";
import { AvatarGroup, Avatar, Chip } from "@nextui-org/react";
import { trpc } from "@sectors/app/trpc";
import { RoomWithUsersAndGames } from "@server/prisma/prisma.types";
import { useAuthUser } from "@sectors/app/components/AuthUser.context";
import { useRouter } from "next/navigation";
import Button from "@sectors/app/components/General/DebounceButton";
import UserAvatar from "./UserAvatar";
import { GameStatus } from "@server/prisma/prisma.client";
import {
  friendlyDistributionStrategyName,
  renderGameStatusColor,
} from "@sectors/app/helpers";
import { useGame } from "../Game/GameContext";
import {
  RiBankFill,
  RiCheckFill,
  RiClockwiseFill,
  RiCloseCircleFill,
  RiDiscFill,
  RiFundsFill,
  RiListOrdered2,
  RiTeamFill,
  RiTimeFill,
} from "@remixicon/react";
import { HandshakeIcon } from "lucide-react";
interface RoomListProps {
  room: RoomWithUsersAndGames;
  gameId?: string;
}

const GameMeta = ({ gameId }: { gameId: string }) => {
  const { data: game, isLoading } = trpc.game.getGame.useQuery({ id: gameId });
  if (isLoading) return null;
  if (!game) return null;
  return (
    <div className="grid grid-cols-3 gap-1 p-2 bg-gray-800 text-white rounded-md shadow-lg">
      {game.isTimerless ? (
        <div className="flex items-center gap-2">
          <RiClockwiseFill className="text-yellow-400" />
          <span>No Timer</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <RiTimeFill className="text-yellow-400" />
          <span>Timed</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <RiListOrdered2 className="text-green-400" />
        <span>
          {game.GameTurn[game.GameTurn.length - 1].turn +
            " of " +
            game.gameMaxTurns}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <RiBankFill className="text-red-400" />
        <span>${game.bankPoolNumber}</span>
      </div>

      <div className="flex items-center gap-2">
        <RiTeamFill className="text-yellow-400" />
        <span>{game.consumerPoolNumber}</span>
      </div>

      <div className="flex items-center gap-2">
        <RiDiscFill className="text-blue-400" />
        <span>
          {friendlyDistributionStrategyName(game.distributionStrategy)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <RiCheckFill className="text-green-400" />
        <span>MO</span>
      </div>

      <div className="flex items-center gap-2">
        {game.useLimitOrders ? (
          <RiCheckFill className="text-green-400" />
        ) : (
          <RiCloseCircleFill className="text-red-400" />
        )}
        <span>LO</span>
      </div>

      <div className="flex items-center gap-2">
        {game.useShortOrders ? (
          <RiCheckFill className="text-green-400" />
        ) : (
          <RiCloseCircleFill className="text-red-400" />
        )}
        <span>SO</span>
      </div>

      <div className="flex items-center gap-2">
        {game.useOptionOrders ? (
          <RiCheckFill className="text-green-400" />
        ) : (
          <RiCloseCircleFill className="text-red-400" />
        )}
        <span>OO</span>
      </div>
    </div>
  );
};

const RoomListItem: React.FC<RoomListProps> = ({ room }) => {
  const { user } = useAuthUser();
  const router = useRouter();
  const joinRoomMutation = trpc.roomUser.joinRoom.useMutation();
  if (!user) return null;

  const handleJoin = (roomId: number) => {
    joinRoomMutation.mutate({
      roomId,
      userId: user.id,
    });
    router.push(`/rooms/${roomId}`);
  };
  return (
    <div className="flex flex-wrap items-center justify-between p-4 bg-gray-500 rounded-lg mb-4 gap-2">
      <div className="flex flex-col md:flex-row items-center gap-3">
        <AvatarGroup isBordered max={5}>
          {room.users &&
            room.users.length > 0 &&
            room.users.map((data) => (
              <UserAvatar key={data.user.id} user={data.user} size="sm" />
            ))}
        </AvatarGroup>
        <h2 className="text-lg font-bold">{room.name}</h2>
        <div className="flex flex-col gap-1 items-center space-x-4">
          {/* Sectors Game Status */}
          {room.game?.length > 0 && (
            <div className="flex items-center space-x-2">
              <Chip color={renderGameStatusColor(room.game?.[0]?.gameStatus)}>
                {room.game?.[0]?.gameStatus === "FINISHED"
                  ? "COMPLETED"
                  : room.game?.[0]?.gameStatus || GameStatus.PENDING}
              </Chip>
              <div className="flex justify-center items-center bg-slate-800 rounded-medium p-2">
                <RiFundsFill color="#17a34a" />
              </div>
            </div>
          )}

          {/* Executive Game Status */}
          {room.executiveGame?.length > 0 && (
            <div className="flex items-center space-x-2">
              <Chip
                color={renderGameStatusColor(
                  room.executiveGame?.[0]?.gameStatus
                )}
              >
                {room.executiveGame?.[0]?.gameStatus === "FINISHED"
                  ? "COMPLETED"
                  : room.executiveGame?.[0]?.gameStatus || GameStatus.PENDING}
              </Chip>
              <div className="flex justify-center items-center bg-slate-800 rounded-medium p-2">
                <HandshakeIcon color="#5072A7" />
              </div>
            </div>
          )}
        </div>

        {room.game?.[0]?.id && <GameMeta gameId={room.game[0].id} />}
      </div>
      <Button color="primary" onClick={() => handleJoin(room.id)}>
        Join
      </Button>
    </div>
  );
};

export default RoomListItem;
