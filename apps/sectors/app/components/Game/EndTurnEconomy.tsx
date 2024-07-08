import { useGame } from "./GameContext";
import "./EndTurnEconomy.css";
import { sectorColors } from "@server/data/gameData";
import { Sector } from "@server/prisma/prisma.client";
import { RiTeamFill } from "@remixicon/react";

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
      <div className="text-xl">Section {sectorIndex + 1}</div>
      <div>Consumers {sector.consumers}</div>
      <div className="grid grid-cols-5 gap-2">
        {Array(sector.consumers)
          .fill(0)
          .map((_, index) => (
            <RiTeamFill size={30} />
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
      <h1>Economy</h1>
      <div className="flex gap-2 text-xl">
        <span>Consumer Pool</span>
        <span>{gameState.consumerPoolNumber}</span>
      </div>
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
    </div>
  );
};

export default EndTurnEconomy;
