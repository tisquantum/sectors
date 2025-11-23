import {
  Avatar,
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";
import {
  Company,
  OperationMechanicsVersion,
} from "@server/prisma/prisma.client";
import CompanyInfo from "./CompanyInfo";
import { sectorColors } from "@server/data/gameData";
import { CompanyWithSectorOnly } from "@server/prisma/prisma.types";
import { useGame } from "../Game/GameContext";
import CompanyInfoV2 from "./CompanyV2/CompanyInfoV2";

const CompanyComponent: React.FC<{ company: CompanyWithSectorOnly }> = ({
  company,
}) => {
  const { gameState } = useGame();
  console.log('Company Component',gameState.operationMechanicsVersion);
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
          {gameState.operationMechanicsVersion ==
          OperationMechanicsVersion.MODERN ? (
            <CompanyInfoV2 companyId={company.id} />
          ) : (
            <CompanyInfo companyId={company.id} />
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CompanyComponent;
