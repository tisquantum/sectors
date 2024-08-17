import { trpc } from "@sectors/app/trpc";
import TabView from "./TabView";
import { useGame } from "./GameContext";
import PlayerAvatar from "../Player/PlayerAvatar";
import UserAvatar from "../Room/UserAvatar";
import { useEffect } from "react";

const GameSidebar = () => {
  const { currentPhase, gameState } = useGame();
  const { data: roomUsers, isLoading: isLoadingRoomUsers } =
    trpc.roomUser.listRoomUsers.useQuery({
      where: { roomId: gameState.roomId },
    });
  const { data: playerPriorities, refetch: refetchPlayerPriority } =
    trpc.playerPriority.listPlayerPriorities.useQuery({
      where: { gameTurnId: currentPhase?.gameTurnId },
    });
  useEffect(() => {
    refetchPlayerPriority();
  }, [currentPhase?.name]);

  if (isLoadingRoomUsers) {
    return <div>Loading...</div>;
  }
  return (
    <div className="w-full lg:w-1/4 bg-background text-white flex flex-col">
      <div className="text-white p-4">
        <h1 className="text-xl font-bold">{gameState.name}</h1>
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
      <TabView />
    </div>
  );
};

export default GameSidebar;
