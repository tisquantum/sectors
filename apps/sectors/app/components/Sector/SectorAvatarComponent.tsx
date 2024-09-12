import {
  Avatar,
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";
import { sectorColors } from "@server/data/gameData";
import { Sector } from "@server/prisma/prisma.client";
import { SectorWithCompanies } from "@server/prisma/prisma.types";
import SectorInfo from "./SectorInfo";
import { trpc } from "@sectors/app/trpc";
import { RiTeamFill } from "@remixicon/react";

const SectorAvatarComponent = ({ sectorId }: { sectorId: string }) => {
  const { data: sector, isLoading } =
    trpc.sector.getSectorWithCompanies.useQuery({ id: sectorId });
  if (isLoading) return <div>Loading...</div>;
  if (sector == undefined) return null;
  return (
    <Popover>
      <Badge
        content={
          <div className="flex items-center gap-1 text-xs">
            <RiTeamFill size={12} /> <span>{sector.consumers}</span>
          </div>
        }
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
      <PopoverContent>
        <SectorInfo sector={sector} />
      </PopoverContent>
    </Popover>
  );
};

export default SectorAvatarComponent;
