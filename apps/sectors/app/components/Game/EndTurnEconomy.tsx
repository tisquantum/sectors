import { useGame } from "./GameContext";
import "./EndTurnEconomy.css";
import { sectorColors } from "@server/data/gameData";
import { CompanyStatus, PhaseName, Sector } from "@server/prisma/prisma.client";
import { RiHandCoinFill, RiTeamFill } from "@remixicon/react";
import PrestigeRewards from "./PrestigeRewards";
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

const EndTurnEconomy = () => {
  const { currentPhase, gameState, gameId } = useGame();
  const { data: companiesWithSector, isLoading: isLoadingCompanies } =
    trpc.company.listCompaniesWithSector.useQuery({
      where: {
        gameId: gameId,
        status: CompanyStatus.ACTIVE,
      },
    });
  //get sectors
  const sectors = gameState?.sectors.sort((a, b) => {
    return (
      sectorPriority.indexOf(a.sectorName) -
      sectorPriority.indexOf(b.sectorName)
    );
  });
  if (isLoadingCompanies) {
    return <div>Loading companies...</div>;
  }
  if (!companiesWithSector) {
    return <div>No companies found</div>;
  }
  return (
    <div className="flex flex-col justify-center items-center content-center">
      <h1 className="text-2xl">Economy</h1>
      <div className="flex flex-col gap-2 text-xl">
        {currentPhase?.name == PhaseName.END_TURN ? (
          <EndTurnSectorConsumerDistributionAnimation sectors={sectors} />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="flex relative">
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
                        {sectors
                          .sort(
                            (a, b) =>
                              sectorPriority.indexOf(a.sectorName) -
                              sectorPriority.indexOf(b.sectorName)
                          )
                          .map((sector, index) => (
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
                <div className="flex gap-2 text-xl">
                  <span>Consumer Pool</span>
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
                    Once each sector has floated a company, the economy is
                    eligible to begin moving. If at least one company in each
                    sector pay dividends, the economy will move up by 1. If at
                    least one company retains, the economy will move down by 1.
                    If both of these are true, the economy will remain the same.
                  </p>
                }
              >
                <div className="flex gap-2 text-xl">
                  <span>Economy Score</span>
                  <span>{gameState.economyScore}</span>
                </div>
              </Tooltip>
            </div>
            <div className="flex gap-3">
              {sectors
                .sort(
                  (a, b) =>
                    sectorPriority.indexOf(a.sectorName) -
                    sectorPriority.indexOf(b.sectorName)
                )
                .map((sector, index) => (
                  <EconomySector
                    key={sector.id}
                    sector={sector}
                    sectorColor={sectorColors[sector.name]}
                    sectorIndex={index}
                  />
                ))}
            </div>
          </div>
        )}
        <div className="flex flex-col justify-center items-center gap-2 text-xl">
          <h3>Prestige Track</h3>
          <div className="flex gap-2 text-xl">
            <PrestigeRewards />
          </div>
        </div>
        <div className="flex flex-col justify-center items-center gap-2 text-xl">
          <h3>Research Deck</h3>
          <div className="flex gap-2 text-xl">
            <ResearchDeck />
          </div>
        </div>
        <div>
          <CompanyPriorityList companies={companiesWithSector} />
        </div>
      </div>
    </div>
  );
};

export default EndTurnEconomy;
