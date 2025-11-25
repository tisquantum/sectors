import { useEffect, useState } from "react";
import { stockGridPrices } from "@server/data/constants";
import {
  Company,
  OperationMechanicsVersion,
  PhaseName,
  Sector,
} from "@server/prisma/prisma.client";
import DebounceButton from "../General/DebounceButton";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
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
import CompanyInfoV2 from "../Company/CompanyV2/CompanyInfoV2";

const CompanyIpoVote = ({
  company,
  sector,
  isInteractive,
  selectedPrice,
  onPriceSelect,
}: {
  company: Company;
  sector: Sector;
  isInteractive?: boolean;
  selectedPrice: number | null;
  onPriceSelect: (price: number | null) => void;
}) => {
  const { authPlayer, currentTurn, currentPhase, gameState } = useGame();
  const {
    data: ipoVotes,
    isLoading: isLoadingIpoVotes,
    isError: isErrorIpoVotes,
    refetch: refetchIpoVotes,
  } = trpc.game.getIpoVotesForGameTurn.useQuery({
    gameTurnId: currentTurn.id,
  });
  useEffect(() => {
    refetchIpoVotes();
  }, [currentPhase?.id, refetchIpoVotes]);
  const { Company, sectors } = gameState;
  const companyIpoPrices = stockGridPrices.filter(
    (price) => price >= sector.ipoMin && price <= sector.ipoMax
  );
  if (!authPlayer) return <div>Not logged in</div>;
  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg shadow-md">
      <div className="flex items-center gap-2">
        {isInteractive ? (
          <span>Select IPO Price for</span>
        ) : (
          <span>IPO Price for</span>
        )}
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
            {gameState.operationMechanicsVersion ===
            OperationMechanicsVersion.MODERN ? (
              <CompanyInfoV2 companyId={company.id} />
            ) : (
              <CompanyInfo companyId={company.id} />
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Price Grid */}
      <div className="grid grid-cols-4 gap-2">
        {companyIpoPrices.map((price) =>
          isInteractive ? (
            <button
              key={price}
              onClick={() => onPriceSelect(price)}
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
    </div>
  );
};

const IpoVotes = ({ isInteractive }: { isInteractive?: boolean }) => {
  const { gameState, authPlayer, currentTurn, currentPhase } = useGame();
  const [selectedPrices, setSelectedPrices] = useState<Record<string, number | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votesSubmitted, setVotesSubmitted] = useState(false);
  const utils = trpc.useUtils();
  
  const createIpoVotesBatchMutation = trpc.game.createIpoVotesBatch.useMutation({
    onSettled: () => {
      setIsSubmitting(false);
    },
  });
  
  // Get IPO votes for the current turn
  const { data: ipoVotes } = trpc.game.getIpoVotesForGameTurn.useQuery(
    {
      gameTurnId: currentTurn.id,
    },
    { enabled: !!currentTurn?.id }
  );
  
  // Check if user has already submitted votes
  useEffect(() => {
    if (ipoVotes && authPlayer) {
      const userVotes = ipoVotes.filter((vote) => vote.playerId === authPlayer.id);
      if (userVotes.length > 0) {
        setVotesSubmitted(true);
        // Pre-populate selected prices from existing votes
        const prices: Record<string, number | null> = {};
        userVotes.forEach((vote) => {
          prices[vote.companyId] = vote.ipoPrice;
        });
        setSelectedPrices(prices);
      }
    }
  }, [ipoVotes, authPlayer]);
  
  if (!gameState || !authPlayer) return null;
  const { Company, sectors } = gameState;
  
  // In voting phase: show companies without IPO prices
  // In resolution phase: show companies that have votes (regardless of IPO price status)
  const isResolutionPhase = currentPhase?.name === PhaseName.RESOLVE_SET_COMPANY_IPO_PRICES;
  
  let companiesToShow: Company[];
  if (isResolutionPhase) {
    // In resolution phase, show companies that have votes in this turn
    const companyIdsWithVotes = new Set(
      (ipoVotes || []).map((vote) => vote.companyId)
    );
    companiesToShow = Company.filter((company) =>
      companyIdsWithVotes.has(company.id)
    );
  } else {
    // In voting phase, show companies without IPO prices
    companiesToShow = Company.filter(
      (company) => company.ipoAndFloatPrice === null
    );
  }
  
  const handlePriceSelect = (companyId: string, price: number | null) => {
    setSelectedPrices((prev) => ({
      ...prev,
      [companyId]: price,
    }));
  };
  
  const handleSubmitAllVotes = async () => {
    if (!authPlayer) return;
    
    // Get all companies that have a selected price
    const votesToSubmit = companiesToShow
      .filter((company) => selectedPrices[company.id] !== null && selectedPrices[company.id] !== undefined)
      .map((company) => ({
        playerId: authPlayer.id,
        companyId: company.id,
        ipoPrice: selectedPrices[company.id]!,
      }));
    
    if (votesToSubmit.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      // Submit all votes in a single batch request
      await createIpoVotesBatchMutation.mutateAsync({
        votes: votesToSubmit,
      });
      
      setVotesSubmitted(true);
      // Invalidate queries to refresh the UI
      await utils.game.getIpoVotesForGameTurn.invalidate({
        gameTurnId: currentTurn.id,
      });
    } catch (error) {
      console.error("Error submitting IPO votes:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (companiesToShow.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <p className="text-gray-400">
          {isResolutionPhase
            ? "No companies with IPO votes to resolve."
            : "All companies have IPO prices set."}
        </p>
      </div>
    );
  }
  
  const hasAllVotesSelected = companiesToShow.every(
    (company) => selectedPrices[company.id] !== null && selectedPrices[company.id] !== undefined
  );
  
  return (
    <div className="flex flex-col gap-4">
      {companiesToShow.map((company) => {
        const sector = sectors.find((sector) => sector.id === company.sectorId);
        if (!sector) return null;
        return (
          <CompanyIpoVote
            key={company.id}
            company={company}
            sector={sector}
            isInteractive={isInteractive}
            selectedPrice={selectedPrices[company.id] || null}
            onPriceSelect={(price) => handlePriceSelect(company.id, price)}
          />
        );
      })}
      
      {/* Single Submit Votes Button */}
      {isInteractive && !isResolutionPhase && (
        <div className="flex justify-center mt-4">
          {votesSubmitted ? (
            <div className="text-green-400 font-semibold">Votes Submitted</div>
          ) : (
            <DebounceButton
              disabled={!hasAllVotesSelected || isSubmitting}
              onClick={handleSubmitAllVotes}
              isLoading={isSubmitting}
              className="px-8 py-3 text-lg"
            >
              Submit Votes
            </DebounceButton>
          )}
        </div>
      )}
    </div>
  );
};
export default IpoVotes;
