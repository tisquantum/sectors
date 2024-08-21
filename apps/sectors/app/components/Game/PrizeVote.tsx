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

const PrizeComponent = ({
  prize,
  handleSubmit,
  isSubmitted,
  prizeVotes,
}: {
  prize: PrizeWithSectorPrizes;
  handleSubmit: () => void;
  isSubmitted: boolean;
  prizeVotes?: PrizeVoteWithRelations[];
}) => {
  const { currentTurn, authPlayer } = useGame();
  const useCreatePrizeVoteMutation =
    trpc.prizeVotes.createPrizeVote.useMutation();
  return (
    <div className="flex flex-col gap-1 rounded-md bg-slate-800 p-2">
      <div className="flex flex-col gap-1">
        <div className="flex gap-1">
          {prize.cashAmount && (
            <div className="flex gap-1">${prize.cashAmount}</div>
          )}
          {prize.prestigeAmount && (
            <div className="flex gap-1">
              <RiSparkling2Fill /> {prize.prestigeAmount}
            </div>
          )}
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
                <RiGameFill />
                <span>{sectorPrize.Sector.name}</span>
                <span>
                  {SectorEffects[sectorPrize.Sector.sectorName].passive}
                </span>
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
      {isSubmitted ? (
        <div>Vote submitted</div>
      ) : (
        <DebounceButton
          onClick={() => {
            useCreatePrizeVoteMutation.mutate({
              playerId: authPlayer.id,
              gameTurnId: currentTurn.id,
              prizeId: prize.id,
            });
            handleSubmit();
          }}
        >
          Claim Prize
        </DebounceButton>
      )}
    </div>
  );
};

const PrizeRound = () => {
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
  } = trpc.prizeVotes.listRevealedResults.useQuery({
    gameTurnId: currentTurn.id,
    playerId: authPlayer.id,
  });
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
      <h1>Investor Gambit</h1>
      <p>
        In this round, players vote on the prize they want to win. There are
        three types of rewards:
        <ul>
          <li>Cash</li>
          <li>Prestige</li>
          <li>
            Passive Sector Effects:
            <ul>
              <li>
                Passive Sector Effects are applied to all companies in the
                sector.
              </li>
              <li>
                These effects will persist on this company until a passive
                effect is assigned to a different company in the same sector.
              </li>
            </ul>
          </li>
        </ul>
      </p>
      <p>
        Players vote on the prize they want to win. If more than one player
        votes on the prize, no one wins it and the prize is not distributed. If
        all votes are distributed, money is doubled in each prize pool. Placing
        a vote is not required.
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
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrizeRound;
