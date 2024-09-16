import {
  Avatar,
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from "@nextui-org/react";
import { sectorColors } from "@server/data/gameData";
import { Sector } from "@server/prisma/prisma.client";
import { SectorWithCompanies } from "@server/prisma/prisma.types";
import SectorInfo from "./SectorInfo";
import { trpc } from "@sectors/app/trpc";
import { RiTeamFill } from "@remixicon/react";
import {
  baseToolTipStyle,
  tooltipParagraphStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";
import { useGame } from "../Game/GameContext";

const SectorAvatarComponent = ({
  sectorId,
  showSectorName = false,
}: {
  sectorId: string;
  showSectorName?: boolean;
}) => {
  const { gameState } = useGame();
  const { data: sector, isLoading } =
    trpc.sector.getSectorWithCompanies.useQuery({ id: sectorId });
  if (isLoading) return <div>Loading...</div>;
  if (sector == undefined) return null;
  return (
    <Popover>
      <div className="flex flex-col gap-1">
        <div className="flex">
          <Tooltip
            classNames={{ base: baseToolTipStyle }}
            className={tooltipStyle}
            content={<p className={tooltipParagraphStyle}>{sector.name}</p>}
          >
            <Badge
              content={
                <div className="flex items-center gap-1 text-xs">
                  <RiTeamFill size={12} /> <span>{sector.consumers}</span>
                </div>
              }
              // content={
              //   gameState.sectorPriority.find((p) => p.sectorId === sector.id)
              //     ?.priority
              // }
              placement="top-right"
            >
              <PopoverTrigger>
                <Avatar
                  className={`text-stone-200 font-extrabold cursor-pointer`}
                  style={{ backgroundColor: sectorColors[sector.name] }}
                  name={String(sector.name).toUpperCase()}
                  size="md"
                  isBordered
                />
              </PopoverTrigger>
            </Badge>
          </Tooltip>
        </div>
        {showSectorName && (
          <div className="text-xs text-gray-500">{sector.name}</div>
        )}
      </div>

      <PopoverContent>
        <SectorInfo sector={sector} />
      </PopoverContent>
    </Popover>
  );
};

export default SectorAvatarComponent;
