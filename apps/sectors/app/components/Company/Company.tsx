import {
  Avatar,
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";
import { Company } from "@server/prisma/prisma.client";
import CompanyInfo from "./CompanyInfo";
import { sectorColors } from "@server/data/gameData";
import { CompanyWithSectorOnly } from "@server/prisma/prisma.types";

const CompanyComponent: React.FC<{ company: CompanyWithSectorOnly }> = ({
  company,
}) => {
  return (
    <div>
      <Popover>
        <PopoverTrigger>
          <Avatar
            className={`text-stone-200 font-extrabold cursor-pointer`}
            style={{ backgroundColor: sectorColors[company.Sector.name] }}
            name={company.stockSymbol}
          />
        </PopoverTrigger>
        <PopoverContent>
          <CompanyInfo companyId={company.id} />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CompanyComponent;
