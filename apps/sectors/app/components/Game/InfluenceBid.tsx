import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import PlayerAvatar from "../Player/PlayerAvatar";
import { DEFAULT_INFLUENCE } from "@server/data/constants";
import { Input } from "@nextui-org/react";
import DebounceButton from "../General/DebounceButton";
import { use, useEffect, useState } from "react";

const InfluenceBidAction = () => {
  const { currentPhase, authPlayer } = useGame();
  const [influence, setInfluence] = useState("0");
  const [isLoadingInfluenceSubmission, setIsLoadingInfluenceSubmission] =
    useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { mutate: createInfluenceVote } =
    trpc.influenceRoundVotes.createInfluenceVote.useMutation({
      onSettled: () => {
        setIsLoadingInfluenceSubmission(false);
      },
    });
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
      {isSubmitted ? (
        <div>Bid has been submit.</div>
      ) : (
        <DebounceButton
          onClick={() => {
            setIsLoadingInfluenceSubmission(true);
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
            setIsSubmitted(true);
          }}
          className="mt-2"
          isLoading={isLoadingInfluenceSubmission}
        >
          Submit Influence Bid
        </DebounceButton>
      )}
    </div>
  );
};

const InfluenceBid = ({ isRevealRound }: { isRevealRound?: boolean }) => {
  const { gameId, currentPhase, gameState } = useGame();
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
      gameId,
    },
    {
      enabled: isRevealRound,
    }
  );
  useEffect(() => {
    if (isRevealRound) {
      revealRefetch();
    }
  }, [currentPhase?.name]);

  if (!currentPhase?.influenceRoundId) {
    return null;
  }
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  const players = gameState?.Player || [];
  // Filter out players who have already voted
  const playersWhoHaveNotVoted = players.filter(
    (player) =>
      !influenceRoundVotesReveal?.some((vote) => vote.playerId === player.id)
  );

  // Extend influenceRoundVotesReveal for players who have not voted
  let influenceRoundVotesRevealExtended =
    influenceRoundVotesReveal?.map((vote) => ({
      id: vote.id,
      influence: vote.influence,
      Player: vote.Player,
    })) || [];

  // Use unique IDs for new votes
  const nextId = influenceRoundVotesRevealExtended.length
    ? Math.max(...influenceRoundVotesRevealExtended.map((vote) => vote.id)) + 1
    : 0;

  influenceRoundVotesRevealExtended = influenceRoundVotesRevealExtended.concat(
    playersWhoHaveNotVoted.map((player, index) => ({
      id: nextId + index,
      influence: 0,
      Player: player,
    }))
  );
  const maxInfluence = influenceRound?.[0]?.maxInfluence || DEFAULT_INFLUENCE;
  return (
    <div className="flex flex-col justify-center items-center content-center h-full justify-between">
      <div className="flex flex-col grow items-center content-center justify-center gap-2">
        <h1 className="text-2xl">Influence Bid</h1>
        {isRevealRound ? (
          <div>
            <div className="flex gap-4">
              {influenceRoundVotesRevealExtended?.map((vote) => (
                <div key={vote.id} className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2 bg-slate-800 p-2 rounded-md items-center max-w-64">
                    <PlayerAvatar player={vote.Player} showNameLabel />
                    <div className="text-center">
                      uses {vote.influence} influence of {maxInfluence}, earning
                      a bonus ${maxInfluence - vote.influence}.
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
              You have {maxInfluence} influence to spend. For every influence
              you don&apos;t spend, collect $1.
            </h2>
          </div>
        )}
      </div>
      {!isRevealRound && <InfluenceBidAction />}
    </div>
  );
};

export default InfluenceBid;
