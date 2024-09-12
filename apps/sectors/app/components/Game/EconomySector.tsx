import { RiHandCoinFill, RiTeamFill } from "@remixicon/react";
import { Sector } from "@server/prisma/prisma.client";
import SectorAvatarComponent from "../Sector/SectorAvatarComponent";

const EconomySector = ({
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
      className={`flex flex-col gap-2 text-slate-200 p-4 justify-center items-center rounded-md ${sectorColor}`}
      style={{ backgroundColor: sectorColor }}
    >
      <div className="flex items-center gap-2">
        <SectorAvatarComponent sectorId={sector.id} />
        <div className="text-xl">{sector.name}</div>
      </div>
      <div className="text-xl flex gap-2">
        <RiHandCoinFill /> {sector.demand + (sector.demandBonus || 0)}
      </div>
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

export default EconomySector;
