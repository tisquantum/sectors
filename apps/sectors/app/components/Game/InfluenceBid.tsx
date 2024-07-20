import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import PlayerAvatar from "../Player/PlayerAvatar";
import { DEFAULT_INFLUENCE } from "@server/data/constants";
import { Input } from "@nextui-org/react";

const InfluenceBidAction = () => {
  const { currentPhase, authPlayer } = useGame();
  const { mutate: createInfluenceVote } =
    trpc.influenceRoundVotes.createInfluenceVote.useMutation();
  if (!currentPhase?.influenceRoundId) {
    return null;
  }
  return (
    <div>
      <Input
        type="number"
        placeholder="Influence"
        onChange={(e) => {
          const influence = parseInt(e.target.value);
          if (influence < 0 || influence > DEFAULT_INFLUENCE) {
            return;
          }
          createInfluenceVote({
            influenceRoundId: currentPhase.influenceRoundId || 0,
            playerId: authPlayer.id,
            influence,
          });
        }}
      />
    </div>
  );
};

const InfluenceBid = ({ isRevealRound }: { isRevealRound?: boolean }) => {
  const { currentPhase } = useGame();
  const {
    data: influenceRound,
    isLoading,
    error,
    refetch,
  } = trpc.influenceRound.listInfluenceRounds.useQuery({
    where: {
      id: currentPhase?.influenceRoundId,
    },
  });
  const {
    data: influenceRoundVotesReveal,
    isLoading: revealLoading,
    error: revealError,
    refetch: revealRefetch,
  } = trpc.influenceRoundVotes.listInfluenceVotes.useQuery(
    {
      where: {
        influenceRoundId: currentPhase?.influenceRoundId,
      },
      orderBy: {
        influence: "desc",
      },
    },
    {
      enabled: isRevealRound,
    }
  );
  if (!currentPhase?.influenceRoundId) {
    return null;
  }
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        <h1>Influence Bid</h1>
        {isRevealRound ? (
          <div>
            <h2>Revealing Influence Votes.</h2>
            {influenceRoundVotesReveal?.map((vote) => (
              <div key={vote.id} className="flex flex-col gap-2">
                <p>
                  <PlayerAvatar player={vote.Player} />
                  bid {vote.influence} of {DEFAULT_INFLUENCE}.
                </p>
                <p>
                  &nbsp;
                  {vote.Player.nickname} earns &nbsp; $
                  {DEFAULT_INFLUENCE - vote.influence}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <h2>
              Place a bid of influence to determine starting player priority.
              For every influence you don't spend, collect $1.
            </h2>
          </div>
        )}
      </div>
      <InfluenceBidAction />
    </div>
  );
};

export default InfluenceBid;
