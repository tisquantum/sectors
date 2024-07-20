import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import PlayerAvatar from "../Player/PlayerAvatar";
import { DEFAULT_INFLUENCE } from "@server/data/constants";
import { Input } from "@nextui-org/react";
import DebounceButton from "../General/DebounceButton";
import { useState } from "react";

const InfluenceBidAction = () => {
  const { currentPhase, authPlayer } = useGame();
  const [influence, setInfluence] = useState("0");
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
        min={0}
        max={DEFAULT_INFLUENCE}
        value={influence}
        onChange={(e) => {
          setInfluence(e.target.value);
        }}
      />
      <DebounceButton
        onClick={() => {
          let influenceNum = parseInt(influence);
          if (influenceNum < 0 || influenceNum > DEFAULT_INFLUENCE) {
            return;
          }
          createInfluenceVote({
            influenceRoundId: currentPhase.influenceRoundId || 0,
            playerId: authPlayer.id,
            influence: influenceNum,
            gameId: currentPhase.gameId,
          });
        }}
        className="mt-2"
      >
        Submit Influence Bid
      </DebounceButton>
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
    <div className="flex flex-col justify-center items-center content-center h-full justify-between">
      <div className="flex flex-col grow items-center content-center justify-center gap-2">
        <h1 className="text-2xl">Influence Bid</h1>
        {isRevealRound ? (
          <div>
            <div className="flex gap-4">
              {influenceRoundVotesReveal?.map((vote) => (
                <div key={vote.id} className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2 bg-slate-800 p-2 rounded-md items-center max-w-64">
                    <PlayerAvatar player={vote.Player} showNameLabel />
                    <div className="text-center">
                      uses {vote.influence} influence of {DEFAULT_INFLUENCE},
                      earning a bonus ${DEFAULT_INFLUENCE - vote.influence}.
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
      {!isRevealRound && <InfluenceBidAction />}
    </div>
  );
};

export default InfluenceBid;
