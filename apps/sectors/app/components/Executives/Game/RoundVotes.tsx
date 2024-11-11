import { trpc } from "@sectors/app/trpc";
import { useExecutiveGame } from "./GameContext";
import { Badge, Avatar } from "@nextui-org/react";
import { Influence, InfluenceType } from "@server/prisma/prisma.client";
import InfluenceComponent from "./Influence";

export const RoundVotes = ({ gameId }: { gameId: string }) => {
  const { gameState } = useExecutiveGame();
  const { players } = gameState;
  const {
    data: roundVotes,
    isLoading,
    isError,
  } = trpc.executiveInfluenceVoteRound.listVoteRounds.useQuery({
    where: { gameId },
  });

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
            : influence.ownedByPlayerId;
        if (!key) return acc;

        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(influence);
        return acc;
      }, {} as Record<string, Influence[]>);

      return Object.entries(grouped).map(([key, influences]) => ({
        key,
        influences,
      }));
    });

    return { round: index + 1, groupedInfluences };
  });

  return (
    <div className="space-y-4">
      {groupedByRound.map(({ round, groupedInfluences }) => (
        <div key={`round-${round}`}>
          <h3 className="text-lg font-bold">Round {round}</h3>
          <div className="space-y-2 mt-2">
            {groupedInfluences.map(({ key, influences }) => {
              // Check if this group is for CEO influence
              if (key === "ceo") {
                return (
                  <div key="ceo" className="cursor-pointer">
                    <Badge color="success" content={influences.length.toString()}>
                      <Avatar name="CEO" size="sm" />
                    </Badge>
                  </div>
                );
              }

              // For regular player influence
              const playerId = key;
              return (
                <div key={playerId} className="flex items-center space-x-2">
                  <InfluenceComponent
                    playerId={playerId}
                    influenceCount={influences.length}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
