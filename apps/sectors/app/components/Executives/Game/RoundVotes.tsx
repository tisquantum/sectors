import { trpc } from "@sectors/app/trpc";
import { useExecutiveGame } from "./GameContext";
import { Badge, Avatar } from "@nextui-org/react";
import { Influence, InfluenceType } from "@server/prisma/prisma.client";
import InfluenceComponent from "./Influence";
import PlayerAvatar from "../Player/PlayerAvatar";
import { PlayerAvatarById } from "../Player/PlayerAvatarById";
import { useEffect } from "react";

export const RoundVotes = ({ gameId }: { gameId: string }) => {
  const { gameState, currentPhase, pingCounter } = useExecutiveGame();
  const { players } = gameState;
  const {
    data: roundVotes,
    isLoading,
    isError,
    refetch,
  } = trpc.executiveInfluenceVoteRound.listVoteRounds.useQuery({
    where: { gameId },
  });

  useEffect(() => {
    refetch();
  }, [pingCounter, currentPhase?.id]);

  if (!players) {
    return <div>Players not found</div>;
  }
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error</div>;
  }
  if (!roundVotes || roundVotes.length === 0) {
    return <div>No votes found</div>;
  }

  // Group influences by round
  const groupedByRound = roundVotes.map((vote, index) => {
    const groupedInfluences = vote.playerVotes.flatMap((playerVote) => {
      const grouped = playerVote.influence.reduce((acc, influence) => {
        const key =
          influence.influenceType === InfluenceType.CEO
            ? "ceo"
            : influence.selfPlayerId;

        if (!key) return acc;

        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(influence);
        return acc;
      }, {} as Record<string, Influence[]>);

      // Include the playerId who cast the vote
      return Object.entries(grouped).map(([key, influences]) => ({
        key,
        influences,
        playerId: playerVote.playerId, // Capturing the player who cast the vote
      }));
    });

    return { round: index + 1, groupedInfluences };
  });

  return (
    <div className="flex flex-col gap-5">
      {groupedByRound.map(({ round, groupedInfluences }) => (
        <div key={`round-${round} mt-2`}>
          <h3 className="text-lg font-bold">Round {round}</h3>
          <div className="flex flex-row gap-3 mt-2">
            {groupedInfluences.map(
              ({ key, influences, playerId: playerIdOwner }) => {
                if (!playerIdOwner) {
                  return <div key="no-owner">No owner</div>;
                }
                // Check if this group is for CEO influence
                if (key === "ceo") {
                  return (
                    <div key="ceo" className="cursor-pointer">
                      <Badge
                        className="bottom-[-7px]"
                        color="success"
                        placement="bottom-left"
                        content={
                          <PlayerAvatarById
                            playerId={playerIdOwner}
                            size="sm"
                          />
                        }
                      >
                        <Badge
                          color="success"
                          content={influences.length.toString()}
                        >
                          <Avatar name="CEO" size="sm" />
                        </Badge>
                      </Badge>
                    </div>
                  );
                }

                // For regular player influence
                const playerId = key;
                return (
                  <div key={playerId} className="flex items-center space-x-2">
                    <Badge
                      className="bottom-[-7px]"
                      color="success"
                      placement="bottom-left"
                      content={
                        <PlayerAvatarById playerId={playerIdOwner} size="sm" />
                      }
                    >
                      <InfluenceComponent
                        playerId={playerId}
                        influenceCount={influences.length}
                      />
                    </Badge>
                  </div>
                );
              }
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
