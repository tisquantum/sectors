import { useGame } from "./GameContext";
import "./EndTurnEconomy.css";
import { sectorColors } from "@server/data/gameData";
import { CompanyStatus, OperationMechanicsVersion, PhaseName, Sector } from "@server/prisma/prisma.client";
import { useRef, useEffect } from "react";
import {
  RiGlasses2Fill,
  RiHandCoinFill,
  RiSparkling2Fill,
  RiTeamFill,
} from "@remixicon/react";
// PrestigeRewards import removed - not used in modern game
import ResearchDeck from "../ResearchDeck/ResearchDeck";
import { Tooltip, Tabs, Tab } from "@nextui-org/react";
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
import { WorkforceTrack, SectorResearchTracks } from "./Tracks";
import CapitalGains from "./CapitalGains";
import Divestment from "./Divestment";
import ForecastPhase from "./ForecastPhase";

const EndTurnEconomy = () => {
  const { currentPhase, gameState, gameId } = useGame();
  
  // Get forecast-based consumer distribution (for modern operations)
  const { data: forecastConsumerDistribution } = trpc.forecast.getForecastConsumerDistribution.useQuery(
    { gameId: gameId || "" },
    { 
      enabled: !!gameId && gameState?.operationMechanicsVersion === OperationMechanicsVersion.MODERN,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 5000, // 5 seconds
    }
  );
  
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
  if (isLoadingCompanies) {
    return <div>Loading companies...</div>;
  }
  if (!companiesWithSector) {
    return <div>No companies found</div>;
  }
  return (
    <div className="flex flex-col justify-center items-center content-center w-full max-w-7xl mx-auto">
      <Tabs 
        aria-label="End Turn Information" 
        className="w-full"
        classNames={{
          tabList: "w-full",
          panel: "w-full",
        }}
      >
        <Tab key="overview" title="Overview">
          <div className="flex flex-col gap-6 text-base lg:text-xl w-full p-4">
            {currentPhase?.name == PhaseName.END_TURN ? (
              <EndTurnSectorConsumerDistributionAnimation sectors={sectors} />
            ) : (
              <div className="flex flex-col flex-wrap items-center gap-4">
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
                      <p className={tooltipParagraphStyle}>
                        The economy score is determined by worker allocation. It starts at 10
                        and increases by 1 for every 2 workers allocated to factories, marketing
                        campaigns, or research. As more workers are employed across the economy,
                        the economy score increases, reflecting a stronger economy.
                      </p>
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
                    // Use forecast-based distribution for modern operations, legacy for others
                    const consumerCount: number = gameState?.operationMechanicsVersion === OperationMechanicsVersion.MODERN
                      ? (forecastConsumerDistribution?.[sector.id] ?? 0)
                      : (sector.consumers || 0);
                    
                    return (
                      <EconomySector
                        key={sector.id}
                        sector={sector}
                        sectorColor={sectorColors[sector.name]}
                        sectorIndex={index}
                        consumerCount={consumerCount}
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
            
            {/* Modern Operations Tracks - Only show for MODERN operation mechanics */}
            {gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN && (
              <div className="mt-6 space-y-6 w-full">
                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-xl font-semibold text-gray-200 mb-4">
                    Modern Operations
                  </h3>
                  <div className="space-y-6">
                    <WorkforceTrack />
                    <div className="mt-6">
                      <div className="mb-4">
                        <h4 className="text-lg font-semibold text-gray-300">
                          Sector Research Tracks
                        </h4>
                        <p className="text-sm text-gray-400 mt-1">
                          Track sector-wide research progress. Companies in each sector contribute to their sector&apos;s research track.
                        </p>
                      </div>
                      <SectorResearchTracks />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Tab>
        
        <Tab key="capital-gains" title="Capital Gains">
          <div className="w-full p-4">
            <CapitalGains />
          </div>
        </Tab>
        
        <Tab key="divestment" title="Divestment">
          <div className="w-full p-4">
            <Divestment />
          </div>
        </Tab>
        
        <Tab key="forecast" title="FORECAST">
          <div className="w-full p-4">
            <ForecastPhase />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default EndTurnEconomy;
