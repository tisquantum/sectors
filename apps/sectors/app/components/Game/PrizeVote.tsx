import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { Prize } from "@server/prisma/prisma.client";
import { RiGameFill, RiRepeat2Fill, RiSparkling2Fill } from "@remixicon/react";
import {
  PrizeVoteWithRelations,
  PrizeWithSectorPrizes,
} from "@server/prisma/prisma.types";
import { SectorEffects } from "@server/data/constants";
import DebounceButton from "../General/DebounceButton";
import { useState } from "react";
import { sectorColors } from "@server/data/gameData";
import PlayerAvatar from "../Player/PlayerAvatar";
import PassiveEffect from "../Company/PassiveEffect";

const PrizeComponent = ({
  prize,
  handleSubmit,
  isSubmitted,
  prizeVotes,
  handleMutationSuccess,
  isRevealRound,
}: {
  prize: PrizeWithSectorPrizes;
  handleSubmit: () => void;
  isSubmitted: boolean;
  prizeVotes?: PrizeVoteWithRelations[];
  handleMutationSuccess?: () => void;
  isRevealRound: boolean;
}) => {
  const { currentTurn, authPlayer } = useGame();
  const useCreatePrizeVoteMutation =
    trpc.prizeVotes.createPrizeVote.useMutation({
      onSettled: () => {
        handleMutationSuccess && handleMutationSuccess();
        setIsLoadingClaimPrize(false);
      },
    });
  const [isLoadingClaimPrize, setIsLoadingClaimPrize] = useState(false);
  return (
    <div className="flex flex-col gap-1 rounded-md bg-slate-800 p-2 justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex justify-between gap-1">
          {prize.cashAmount && (
            <div className="flex flex-col gap-1">
              <h4>Cash Reward</h4>
              <div className="flex gap-1">${prize.cashAmount}</div>
            </div>
          )}
          {/* Prestige reward removed - not used in modern game */}
        </div>
        <div className="flex gap-1">
          {prize.SectorPrizes &&
            prize.SectorPrizes.map((sectorPrize) => (
              <div
                key={sectorPrize.sectorId}
                className="flex flex-col gap-1 rounded-md p-2"
                style={{
                  backgroundColor: sectorColors[sectorPrize.Sector.name],
                }}
              >
                <span className="text-md">Passive Reward</span>
                <PassiveEffect
                  passiveEffect={
                    SectorEffects[sectorPrize.Sector.sectorName].passive
                  }
                  sectorName={sectorPrize.Sector.name}
                  showDescription
                />
              </div>
            ))}
        </div>
        {prizeVotes && (
          <div>
            Votes: {prizeVotes.length}{" "}
            {prizeVotes.length > 0 && (
              <div>
                {prizeVotes.map((vote) => (
                  <div key={vote.id}>
                    <PlayerAvatar player={vote.Player} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {!isRevealRound ? (
        isSubmitted ? (
          <div>Vote submitted</div>
        ) : (
          authPlayer && (
            <DebounceButton
              onClick={() => {
                setIsLoadingClaimPrize(true);
                useCreatePrizeVoteMutation.mutate({
                  playerId: authPlayer.id,
                  gameTurnId: currentTurn.id,
                  prizeId: prize.id,
                });
                handleSubmit();
              }}
              isLoading={isLoadingClaimPrize}
            >
              Claim Prize
            </DebounceButton>
          )
        )
      ) : (
        <div>Reveal Round</div>
      )}
    </div>
  );
};

const PrizeRound = ({ isRevealRound = false }: { isRevealRound?: boolean }) => {
  const { currentTurn, authPlayer } = useGame();
  const {
    data: prizes,
    isLoading: isLoadingPrizes,
    isError: isErrorPrizes,
  } = trpc.prizes.listPrizes.useQuery({
    where: {
      gameTurnId: currentTurn.id,
    },
    orderBy: { createdAt: "asc" },
  });
  const {
    data: prizeVotes,
    isLoading: isLoadingVotes,
    isError: isErrorVotes,
    refetch: refetchVotes,
  } = trpc.prizeVotes.listRevealedResults.useQuery(
    isRevealRound
      ? {
          gameTurnId: currentTurn.id,
        }
      : {
          gameTurnId: currentTurn.id,
          playerId: authPlayer?.id,
        }
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  if (isLoadingPrizes) return <div>Loading...</div>;
  if (isErrorPrizes) return <div>Error loading prizes</div>;
  if (!prizes) return <div>No prizes found</div>;
  const handleSubmitVote = () => {
    setIsSubmitted(true);
  };
  if (isLoadingVotes) return <div>Loading votes...</div>;
  if (isErrorVotes) return <div>Error loading votes</div>;
  return (
    <div className="flex flex-col gap-2">
      <h1>Investor Tranches</h1>
      <p>
        In this round, players vote on the tranch they want to win. There are
        three types of rewards:
      </p>
      <ul>
        <li>Cash</li>
        {/* Prestige removed - not used in modern game */}
        <li>
          Passive Sector Effects:
          <ul>
            <li>
              Passive Sector Effects are applied to all companies in the sector.
            </li>
            <li>
              These effects will persist on this company until a passive effect
              is assigned to a different company in the same sector.
            </li>
          </ul>
        </li>
      </ul>
      <p>
        Players vote on the tranch they want to win. If more than one player
        votes on the tranch, no one wins it and the tranch is not distributed.
        If all votes are distributed, money is doubled in each prize pool.
        Placing a vote is not required.
      </p>
      <p>
        After voting, any player who receives a cash reward may distribute this
        reward amongst all players in the game in whatever way they see fit.
      </p>
      <div className="flex flex-wrap gap-2">
        {prizes.map((prize) => (
          <div key={prize.id} className="flex">
            <PrizeComponent
              prize={prize}
              handleSubmit={handleSubmitVote}
              isSubmitted={isSubmitted}
              prizeVotes={prizeVotes?.filter(
                (vote) => vote.prizeId === prize.id
              )}
              handleMutationSuccess={() => {
                refetchVotes();
              }}
              isRevealRound={isRevealRound}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrizeRound;
