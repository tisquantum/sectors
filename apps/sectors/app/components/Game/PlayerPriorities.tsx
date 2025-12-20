import { trpc } from "@sectors/app/trpc";
import { motion } from "framer-motion";
import { useGame } from "./GameContext";
import { EVENT_PLAYER_READINESS_CHANGED } from "@server/pusher/pusher.types";
import { PlayerReadiness } from "@server/data/constants";
import { useEffect, useMemo, useState } from "react";
import PlayerAvatar from "../Player/PlayerAvatar";
import DebounceButton from "../General/DebounceButton";
import UserAvatar from "../Room/UserAvatar";

const PlayerPriorities = () => {
  const {
    currentPhase,
    gameState,
    authPlayer,
    socketChannel: channel,
  } = useGame();
  const { data: roomUsers, isLoading: isLoadingRoomUsers } =
    trpc.roomUser.listRoomUsers.useQuery({
      where: { roomId: gameState.roomId },
    });
  //TODO: If current phase is undefined and we rely solely on that for a query, the data will select all!
  //TODO: This is a bug that needs to be addressed anywhere we make assumption on data from hooks.
  const { data: playerPrioritiesData, refetch: refetchPlayerPriority } =
    trpc.playerPriority.listPlayerPriorities.useQuery(
      {
        where: { gameTurnId: currentPhase?.gameTurnId },
      },
      {
        enabled: !!currentPhase?.gameTurnId,
      }
    );
  const {
    data: playerReadinessData,
    isLoading: isLoadingPlayerReadinessData,
    refetch: refetchPlayerReadiness,
  } = trpc.game.listPlayerReadiness.useQuery({
    gameId: gameState.id,
  });
  const [isLoadingPlayerReadiness, setIsLoadingPlayerReadiness] =
    useState(false);
  const useSetPlayerReadinessMutation =
    trpc.game.setPlayerReadiness.useMutation({
      onSettled: () => {
        setIsLoadingPlayerReadiness(false);
      },
    });

  const playerPriorities = useMemo(
    () => playerPrioritiesData,
    [playerPrioritiesData]
  );
  const playerReadiness = useMemo(
    () => playerReadinessData,
    [playerReadinessData]
  );

  useEffect(() => {
    if (currentPhase) {
      refetchPlayerPriority();
      refetchPlayerReadiness();
    }
  }, [currentPhase?.name, currentPhase, refetchPlayerPriority, refetchPlayerReadiness]);
  useEffect(() => {
    if (!channel) return;

    channel.bind(EVENT_PLAYER_READINESS_CHANGED, (data: PlayerReadiness) => {
      refetchPlayerReadiness();
    });

    return () => {
      channel.unbind(EVENT_PLAYER_READINESS_CHANGED);
    };
  }, [channel, isLoadingPlayerReadinessData, refetchPlayerReadiness]);
  if (isLoadingRoomUsers || isLoadingPlayerReadinessData) {
    return <div>Loading...</div>;
  }
  return (
    <div className="flex">
      {(playerPriorities?.length || 0) > 0 ? (
        <div className="flex gap-1 items-center">
          <div className={`flex flex-row gap-2 p-2`}>
            {playerPriorities?.map((playerPriority) => (
              <div key={playerPriority.player.id}>
                <div
                  className={`rounded-full p-1 w-12 h-12
                    ${
                      playerReadiness &&
                      playerReadiness.find(
                        (pr) => pr.playerId === playerPriority.player.id
                      )?.isReady
                        ? "bg-green-600"
                        : "bg-slate-600"
                    }`}
                >
                  <PlayerAvatar
                    player={playerPriority.player}
                    badgeContent={playerPriority.priority}
                  />
                </div>
              </div>
            ))}
          </div>
          {playerPriorities?.length === playerReadiness?.length &&
          playerReadiness?.every((pr) => pr.isReady) ? (
            <motion.div
              className="bg-green-600 p-2 rounded-md w-full text-center text-white"
              initial={{ opacity: 0.8, scale: 0.95 }}
              animate={{ opacity: [0.8, 1], scale: [0.95, 1] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              All Players Ready - Loading ...
            </motion.div>
          ) : (
            authPlayer &&
            playerReadiness && (
              <DebounceButton
                color="primary"
                className={`${
                  playerReadiness.find((pr) => pr.playerId === authPlayer.id)
                    ?.isReady
                    ? "bg-slate-600"
                    : "bg-green-600"
                } p-2 w-full`}
                onClick={() => {
                  setIsLoadingPlayerReadiness(true);
                  useSetPlayerReadinessMutation.mutate({
                    gameId: gameState.id,
                    playerId: authPlayer.id,
                    isReady: playerReadiness.find(
                      (pr) => pr.playerId === authPlayer.id
                    )?.isReady
                      ? false
                      : true,
                  });
                }}
                isLoading={isLoadingPlayerReadiness}
              >
                {playerReadiness.find((pr) => pr.playerId === authPlayer.id)
                  ?.isReady
                  ? "Not Ready Yet"
                  : "Ready Up"}
              </DebounceButton>
            )
          )}
        </div>
      ) : (
        <div className="flex gap-2 p-2">
          {roomUsers?.map((roomUser) => (
            <div key={roomUser.user.id}>
              <UserAvatar user={roomUser.user} />
            </div>
          ))}

          {gameState.Player.length === playerReadiness?.length &&
          playerReadiness?.every((pr) => pr.isReady) ? (
            <motion.div
              className="bg-green-600 p-2 rounded-md w-full text-center text-white"
              initial={{ opacity: 0.8, scale: 0.95 }}
              animate={{ opacity: [0.8, 1], scale: [0.95, 1] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              All Players Ready - Loading ...
            </motion.div>
          ) : (
            authPlayer &&
            playerReadiness && (
              <DebounceButton
                color="primary"
                className={`${
                  playerReadiness.find((pr) => pr.playerId === authPlayer.id)
                    ?.isReady
                    ? "bg-slate-600"
                    : "bg-green-600"
                } p-2 w-full`}
                onClick={() => {
                  setIsLoadingPlayerReadiness(true);
                  useSetPlayerReadinessMutation.mutate({
                    gameId: gameState.id,
                    playerId: authPlayer.id,
                    isReady: !playerReadiness.find(
                      (pr) => pr.playerId === authPlayer.id
                    )?.isReady,
                  });
                }}
                isLoading={isLoadingPlayerReadiness}
              >
                {playerReadiness.find((pr) => pr.playerId === authPlayer.id)
                  ?.isReady
                  ? "Not Ready Yet"
                  : "Ready Up"}
              </DebounceButton>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerPriorities;
