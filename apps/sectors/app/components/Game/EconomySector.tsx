import { RiHandCoinFill, RiTeamFill, RiTimeLine } from "@remixicon/react";
import { Tooltip } from "@nextui-org/react";
import { Sector } from "@server/prisma/prisma.client";
import SectorAvatarComponent from "../Sector/SectorAvatarComponent";
import { baseToolTipStyle, tooltipParagraphStyle, tooltipStyle } from "@sectors/app/helpers/tailwind.helpers";

// Helper function to calculate research stage from researchMarker
const getResearchStage = (researchMarker: number): number => {
  if (researchMarker >= 10) return 4;
  if (researchMarker >= 7) return 3;
  if (researchMarker >= 4) return 2;
  return 1;
};

// Helper function to get waiting area capacity based on research stage
const getWaitingAreaCapacity = (researchStage: number): number => {
  switch (researchStage) {
    case 1: return 3;
    case 2: return 5;
    case 3: return 7;
    case 4: return 10;
    default: return 3;
  }
};

const EconomySector = ({
  sector,
  sectorColor,
  sectorIndex,
  consumerCount,
}: {
  sector: Sector;
  sectorColor: string;
  sectorIndex: number;
  consumerCount?: number; // Forecast-based consumer count (optional, falls back to sector.consumers)
}) => {
  // Use provided consumerCount or fall back to sector.consumers (legacy)
  const displayConsumerCount = consumerCount !== undefined ? consumerCount : (sector.consumers || 0);
  const researchStage = getResearchStage(sector.researchMarker || 0);
  const waitingAreaCapacity = getWaitingAreaCapacity(researchStage);
  const waitingAreaCount = sector.waitingArea || 0;
  
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
      <div>Consumers {displayConsumerCount}</div>
      {waitingAreaCount > 0 && (
        <Tooltip
          classNames={{ base: baseToolTipStyle }}
          className={tooltipStyle}
          content={
            <div className={tooltipParagraphStyle}>
              <p className="mb-2">
                <strong>Waiting Area:</strong> Consumers who couldn&apos;t be served by factories are placed here.
              </p>
              <p className="mb-2">
                <strong>Capacity:</strong> Based on research stage (Stage 1: 3, Stage 2: 5, Stage 3: 7, Stage 4: 10)
              </p>
              <p className="mb-2">
                <strong>If capacity not exceeded:</strong> Consumers stay and their markers return to the draw bag for next turn.
              </p>
              <p>
                <strong>If capacity exceeded:</strong> All waiting consumers return to global pool and sector loses 1 demand permanently.
              </p>
            </div>
          }
        >
          <div className="text-sm flex items-center gap-1">
            <RiTimeLine size={16} />
            <span>Waiting: {waitingAreaCount}/{waitingAreaCapacity}</span>
          </div>
        </Tooltip>
      )}
      <div className="grid grid-cols-5 gap-2">
        {Array(displayConsumerCount)
          .fill(0)
          .map((_, index) => (
            <RiTeamFill key={index} size={30} />
          ))}
      </div>
    </div>
  );
};

export default EconomySector;
