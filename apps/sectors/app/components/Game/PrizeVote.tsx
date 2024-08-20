import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { Prize } from "@server/prisma/prisma.client";
import { RiSparkling2Fill } from "@remixicon/react";
import { PrizeWithSectorPrizes } from "@server/prisma/prisma.types";
import { SectorEffects } from "@server/data/constants";

const PrizeComponent = ({ prize }: { prize: PrizeWithSectorPrizes }) => {
    const useCreatePrizeVoteMutation = trpc.prizeVotes.createPrizeVote.useMutation();
  return (
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
        <div className="flex gap-1">
          {prize.SectorPrizes &&
            prize.SectorPrizes.map((sectorPrize) => (
              <div key={sectorPrize.sectorId} className="flex gap-1">
                <span>{sectorPrize.Sector.name}</span>
                <span>
                  {SectorEffects[sectorPrize.Sector.sectorName].passive}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const PrizeRound = () => {
  const { currentTurn } = useGame();
  const {
    data: prizes,
    isLoading: isLoadingPrizes,
    isError: isErrorPrizes,
  } = trpc.prizes.listPrizes.useQuery({
    where: { gameTurnId: currentTurn.id },
    orderBy: { value: "asc" },
  });
  if (isLoadingPrizes) return <div>Loading...</div>;
  if (isErrorPrizes) return <div>Error loading prizes</div>;
  if (!prizes) return <div>No prizes found</div>;
  return (
    <div className="flex flex-col gap-2">
      <h1>Influence Round</h1>
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
      <div className="flex flex-wrap gap-1">
        {prizes.map((prize) => (
          <div key={prize.id} className="flex gap-1">
            <PrizeComponent prize={prize} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrizeRound;
