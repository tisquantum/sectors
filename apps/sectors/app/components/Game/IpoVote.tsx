import { useEffect, useState } from "react";
import { stockGridPrices } from "@server/data/constants";
import { Company, PhaseName, Sector } from "@server/prisma/prisma.client";
import DebounceButton from "../General/DebounceButton";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { set } from "lodash";
import PlayerAvatar from "../Player/PlayerAvatar";
import {
  Chip,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";
import CompanyInfo from "../Company/CompanyInfo";
import { RiPriceTag3Fill } from "@remixicon/react";
import { sectorColors } from "@server/data/gameData";

const CompanyIpoVote = ({
  company,
  sector,
  isInteractive,
}: {
  company: Company;
  sector: Sector;
  isInteractive?: boolean;
}) => {
  const { authPlayer, currentTurn, currentPhase, gameState } = useGame();
  const [isLoadingIpoVoteSubmission, setIsLoadingIpoVoteSubmission] =
    useState(false);
  const [ipoVoteSubmitted, setIpoVoteSubmitted] = useState(false);
  const useIpoVoteSubmitMutation = trpc.game.createIpoVote.useMutation({
    onSettled: () => {
      setIsLoadingIpoVoteSubmission(false);
    },
    onSuccess: () => {
      setIpoVoteSubmitted(true);
    },
  });
  const {
    data: ipoVotes,
    isLoading: isLoadingIpoVotes,
    isError: isErrorIpoVotes,
    refetch: refetchIpoVotes,
  } = trpc.game.getIpoVotesForGameTurn.useQuery({
    gameTurnId: currentTurn.id,
  });
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  useEffect(() => {
    refetchIpoVotes();
  }, [currentPhase?.id]);
  const { Company, sectors } = gameState;
  const companyIpoPrices = stockGridPrices.filter(
    (price) => price >= sector.ipoMin && price <= sector.ipoMax
  );
  if (!authPlayer) return <div>Not logged in</div>;
  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold">
        {isInteractive ? (
          <div className="flex items-center gap-2">
            <span>Select IPO Price for</span>
            <Popover>
              <PopoverTrigger>
                <div
                  className={`flex flex-row items-center justify-center px-2 py-1 rounded-medium gap-2 cursor-pointer
                    bg-[${
                      sector.name ? sectorColors[sector.name] : "primary"
                    }]`}
                >
                  <span>{company.name}</span>
                  <span>|</span>
                  <span>{sector?.name}</span>
                  <span>|</span>
                  <div className="flex gap-1 items-center">
                    <RiPriceTag3Fill size={18} />
                    <span>${company.unitPrice}</span>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent>
                <CompanyInfo companyId={company.id} />
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          "IPO Price selections"
        )}
      </h2>

      {/* Price Grid */}
      <div className="grid grid-cols-4 gap-2">
        {companyIpoPrices.map((price) =>
          isInteractive ? (
            <button
              key={price}
              onClick={() => setSelectedPrice(price)}
              className={`py-2 px-4 rounded-md border text-sm font-medium 
          ${
            selectedPrice === price
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
          }`}
            >
              ${price}
            </button>
          ) : (
            <div
              key={price}
              className={`flex flex-col items-start gap-2 py-2 px-4 rounded-md text-sm font-medium 
    ${
      selectedPrice === price
        ? "bg-blue-500 text-white border-blue-500"
        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
    }`}
            >
              <div className="flex items-center justify-between w-full">
                <span>${price}</span>
                {currentPhase?.name ===
                  PhaseName.RESOLVE_SET_COMPANY_IPO_PRICES &&
                  Company.find((c) => c.id === company.id)?.ipoAndFloatPrice ===
                    price && (
                    <Chip color="warning">
                      <span className="text-xs">IPO SELECTED PRICE</span>
                    </Chip>
                  )}
              </div>

              {/* IPO Votes Section */}
              {currentPhase?.name ===
                PhaseName.RESOLVE_SET_COMPANY_IPO_PRICES &&
                ipoVotes &&
                !isLoadingIpoVotes &&
                !isErrorIpoVotes && (
                  <div className="flex flex-wrap gap-1">
                    {ipoVotes
                      .filter(
                        (vote) =>
                          vote.companyId === company.id &&
                          vote.ipoPrice === price
                      )
                      .map((vote) => (
                        <div key={vote.id}>
                          <PlayerAvatar player={vote.Player} />
                        </div>
                      ))}
                  </div>
                )}
            </div>
          )
        )}
      </div>

      {/* Submit Button */}
      {isInteractive &&
        (ipoVoteSubmitted ? (
          <div>Vote Submitted </div>
        ) : (
          <DebounceButton
            disabled={!selectedPrice}
            onClick={() => {
              if (selectedPrice) {
                setIsLoadingIpoVoteSubmission(true);
                console.log(`Selected IPO Price: $${selectedPrice}`);
                useIpoVoteSubmitMutation.mutate({
                  companyId: company.id,
                  playerId: authPlayer.id,
                  ipoPrice: selectedPrice,
                });
              }
            }}
            isLoading={isLoadingIpoVoteSubmission}
          >
            Submit Vote
          </DebounceButton>
        ))}
    </div>
  );
};

const IpoVotes = ({ isInteractive }: { isInteractive?: boolean }) => {
  const { gameState, authPlayer } = useGame();
  if (!gameState || !authPlayer) return null;
  const { Company, sectors } = gameState;
  return (
    <div className="flex flex-col gap-4">
      {Company.map((company) => {
        const sector = sectors.find((sector) => sector.id === company.sectorId);
        if (!sector) return null;
        return (
          <CompanyIpoVote
            key={company.id}
            company={company}
            sector={sector}
            isInteractive={isInteractive}
          />
        );
      })}
    </div>
  );
};
export default IpoVotes;
