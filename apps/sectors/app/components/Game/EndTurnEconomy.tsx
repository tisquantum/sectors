import { useGame } from "./GameContext";
import "./EndTurnEconomy.css";
import { sectorColors } from "@server/data/gameData";
import { CompanyStatus, OperationMechanicsVersion, PhaseName, Sector } from "@server/prisma/prisma.client";
import { useRef, useEffect, useMemo } from "react";
import {
  RiGlasses2Fill,
  RiHandCoinFill,
  RiSparkling2Fill,
  RiTeamFill,
} from "@remixicon/react";
// PrestigeRewards import removed - not used in modern game
import ResearchDeck from "../ResearchDeck/ResearchDeck";
import { Tooltip } from "@nextui-org/react";
import {
  baseToolTipStyle,
  tooltipParagraphStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";
import CompanyPriorityList from "../Company/CompanyPriorityOperatingRound";
import { trpc } from "@sectors/app/trpc";
import { sectorPriority } from "@server/data/constants";
import EconomySector from "./EconomySector";
import EndTurnSectorConsumerDistributionAnimation from "./EndTurnSectorConsumerDistributionAnimation";
import { sortSectorIdsByPriority } from "@server/data/helpers";
import { SectorDemandRankings } from "./SectorDemandRankings";

/**
 * End-of-turn economy summary. The workforce, resource and research tracks that
 * used to live behind tabs here are now permanent fixtures of the board.
 */
const EndTurnEconomy = () => {
  const { currentPhase, gameState, gameId } = useGame();

  // Track query calls to detect infinite loops
  const queryCallCountRef = useRef(0);
  const { data: companiesWithSector, isLoading: isLoadingCompanies } =
    trpc.company.listCompaniesWithSector.useQuery(
      {
        where: {
          gameId: gameId,
          status: CompanyStatus.ACTIVE,
        },
      },
      {
        // Prevent excessive refetching
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 30000, // 30 seconds
      }
    );
  
  // Track query success to detect loops
  useEffect(() => {
    if (companiesWithSector) {
      queryCallCountRef.current += 1;
      const count = queryCallCountRef.current;
      if (count % 5 === 0) {
        console.warn(`[EndTurnEconomy] listCompaniesWithSector query succeeded ${count} times`);
      }
      if (count > 20) {
        console.error(`[EndTurnEconomy] POTENTIAL INFINITE LOOP: listCompaniesWithSector query succeeded ${count} times!`);
      }
    }
  }, [companiesWithSector]);
  
  // Log component renders
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  if (renderCountRef.current % 10 === 0) {
    console.log(`[EndTurnEconomy] Render count: ${renderCountRef.current}`);
  }
  //get sectors
  const sectorPriorityStored = gameState?.sectorPriority;
  let sectors: Sector[] = [];
  if (sectorPriorityStored) {
    sectors = sortSectorIdsByPriority(
      gameState.sectors.map((sector) => sector.id),
      sectorPriorityStored
    )
      .map((sectorId) => gameState.sectors.find((s) => s.id === sectorId))
      .filter((sector) => sector !== undefined) as Sector[];
  } else {
    sectors = gameState.sectors.sort((a, b) => {
      return (
        sectorPriority.indexOf(a.sectorName) -
        sectorPriority.indexOf(b.sectorName)
      );
    });
  }

  /** End-turn consumer split uses sector demand rank; list sectors highest demand first so the overview matches 1st / 2nd / 3rd place. */
  const sectorsByDemandRank = useMemo(() => {
    const totalDemand = (s: Sector) =>
      (s.demand ?? 0) + (s.demandBonus ?? 0);
    return [...sectors].sort((a, b) => totalDemand(b) - totalDemand(a));
  }, [sectors]);

  if (isLoadingCompanies) {
    return <div>Loading companies...</div>;
  }
  if (!companiesWithSector) {
    return <div>No companies found</div>;
  }
  return (
    <div className="flex flex-col justify-center items-center content-center w-full max-w-7xl mx-auto">
      <div className="flex flex-col gap-6 text-base lg:text-xl w-full p-4">
            {currentPhase?.name == PhaseName.END_TURN ? (
              <EndTurnSectorConsumerDistributionAnimation
                sectors={sectorsByDemandRank}
              />
            ) : (
              <div className="flex flex-col flex-wrap items-center gap-4">
                {/* Economy Overview Explanation */}
                <div className="w-full max-w-3xl mb-2 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">Economy Overview</h3>
                  <div className="text-sm text-gray-300 space-y-2">
                    <p>
                      The <strong className="text-white">Economy Score</strong> is the key driver of consumer distribution in the game. It represents the overall economic strength and is determined by worker allocation on the workforce track.
                    </p>
                    <p>
                      <strong className="text-white">How it works:</strong> As workers are allocated to factories, marketing campaigns, and research, the economy score increases. The score starts at 8 when no workers are allocated and improves as more workers are put to work.
                    </p>
                    <p>
                      <strong className="text-white">Consumer Distribution:</strong> The Economy Score determines how many consumers can be distributed from the Consumer Pool to sectors each turn. Higher economy scores mean more consumers can flow into sectors, leading to increased economic activity.
                    </p>
                    <p className="text-xs text-gray-400 italic mt-2">
                      The workforce, resource and research tracks are always on the board above.
                    </p>
                  </div>
                </div>

                {/* Sector Demand Rankings Breakdown */}
                {gameState?.operationMechanicsVersion === OperationMechanicsVersion.MODERN && (
                  <div className="w-full max-w-4xl mb-4">
                    <SectorDemandRankings />
                  </div>
                )}
                <div className="flex flex-wrap relative">
                  <Tooltip
                    classNames={{ base: baseToolTipStyle }}
                    className={tooltipStyle}
                    content={
                      <div>
                        <p className={tooltipParagraphStyle}>
                          The number of consumers available to purchase goods and
                          services each turn. At the end of each turn, they will
                          rotate to each sector being &quot;spooled&quot; out until
                          the total economy score is consumed. Each time consumers
                          visit a sector, the amount of consumers that move into
                          that sector is equivalent to the sectors base demand
                          score. Sectors operate in priority left to right based on
                          this pre-defined ranked order.
                        </p>
                        <table>
                          <thead>
                            <tr>
                              <th>Rank</th>
                              <th>Sector</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sectors.map((sector, index) => (
                              <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{sector.name}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    }
                  >
                    <div className="flex gap-1 items-center text-base lg:text-xl">
                      <RiTeamFill /> <span>Consumer Pool</span>
                      <span>{gameState.consumerPoolNumber}</span>
                    </div>
                  </Tooltip>
                </div>
                <div className="flex relative">
                  <Tooltip
                    classNames={{ base: baseToolTipStyle }}
                    className={tooltipStyle}
                    content={
                      <div>
                        <p className={tooltipParagraphStyle}>
                          The economy score is determined by worker allocation on the workforce track. It starts at 8
                          and increases as workers are allocated to factories, marketing campaigns, or research.
                        </p>
                        <p className={tooltipParagraphStyle}>
                          The score is determined by the rightmost allocated worker&apos;s position on the track. As more workers are employed across the economy,
                          the economy score increases, reflecting a stronger economy.
                        </p>
                        <p className={tooltipParagraphStyle}>
                          The Economy Score determines how many consumers can be distributed from the Consumer Pool to sectors each turn.
                        </p>
                      </div>
                    }
                  >
                    <div className="flex gap-1 text-base lg:text-xl">
                      <span>Economy Score</span>
                      <span>{gameState.economyScore}</span>
                    </div>
                  </Tooltip>
                </div>
                <div className="flex flex-wrap gap-3">
                  {sectors.map((sector, index) => {
                    return (
                      <EconomySector
                        key={sector.id}
                        sector={sector}
                        sectorColor={sectorColors[sector.name]}
                        sectorIndex={index}
                        consumerCount={sector.consumers || 0}
                      />
                    );
                  })}
                </div>
              </div>
            )}
            {/* <div className="flex flex-col justify-center items-center gap-1 text-base lg:text-xl">
              <h3 className="flex items-center gap-1">
                <RiSparkling2Fill /> <span>Prestige Track</span>
              </h3>
              <PrestigeRewards />
            </div>
            <div className="flex flex-col justify-center items-center gap-1 text-base lg:text-xl">
              <h3 className="flex items-center gap-1">
                <RiGlasses2Fill /> <span>Research Deck</span>
              </h3>
              <div className="flex gap-2 text-xl">
                <ResearchDeck />
              </div>
            </div> */}
        <div>
          <CompanyPriorityList companies={companiesWithSector} />
        </div>
      </div>
    </div>
  );
};

export default EndTurnEconomy;
