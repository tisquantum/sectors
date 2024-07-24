import { useGame } from "./GameContext";
import "./EndTurnEconomy.css";
import { sectorColors } from "@server/data/gameData";
import { Sector } from "@server/prisma/prisma.client";
import { RiTeamFill } from "@remixicon/react";
import PrestigeRewards from "./PrestigeRewards";
import ResearchDeck from "../ResearchDeck/ResearchDeck";
import { STABLE_ECONOMY_SCORE } from "@server/data/constants";
import { Tooltip } from "@nextui-org/react";
import { tooltipStyle } from "@sectors/app/helpers/tailwind.helpers";

const SectorComponent = ({
  sector,
  sectorColor,
  sectorIndex,
}: {
  sector: Sector;
  sectorColor: string;
  sectorIndex: number;
}) => {
  return (
    <div
      className={`flex flex-col gap-2 text-slate-200 p-4 justify-center items-center ${sectorColor}`}
      style={{ backgroundColor: sectorColor }}
    >
      <div className="text-xl">{sector.name}</div>
      <div>Consumers {sector.consumers}</div>
      <div className="grid grid-cols-5 gap-2">
        {Array(sector.consumers)
          .fill(0)
          .map((_, index) => (
            <RiTeamFill key={index} size={30} />
          ))}
      </div>
    </div>
  );
};

const EndTurnEconomy = () => {
  const { currentPhase, gameState } = useGame();
  //get sectors
  const sectors = gameState?.sectors;
  return (
    <div className="flex flex-col justify-center items-center content-center">
      <h1 className="text-2xl">Economy</h1>
      <div className="flex flex-col gap-2 text-xl">
        <div className="flex gap-2 text-xl">
          <span>Consumer Pool</span>
          <span>{gameState.consumerPoolNumber}</span>
        </div>
        <Tooltip
          className={tooltipStyle}
          content={
            <p>
              The number of consumers available to purchase goods and services
              each turn. These customers will move between sectors based on the
              demand score of the sector. They will rotate to each sector in a
              loop until the total economy score is consumed.
            </p>
          }
        >
          <div className="flex gap-2 text-xl">
            <span>Economy Score</span>
            <span>{STABLE_ECONOMY_SCORE}</span>
          </div>
        </Tooltip>
        <div className="flex gap-3">
          {sectors.map((sector, index) => (
            <SectorComponent
              key={sector.id}
              sector={sector}
              sectorColor={sectorColors[sector.name]}
              sectorIndex={index}
            />
          ))}
        </div>
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
      </div>
    </div>
  );
};

export default EndTurnEconomy;
