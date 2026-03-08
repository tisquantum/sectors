import { Popover, PopoverContent, PopoverTrigger } from "@nextui-org/react";
import { RiGameFill } from "@remixicon/react";
import {
  tooltipParagraphStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";
import { companyActionsDescription } from "@server/data/constants";
import { sectorColors } from "@server/data/gameData";
import { OperatingRoundAction } from "@server/prisma/prisma.client";

const PassiveEffect = ({
  passiveEffect,
  sectorName,
  showDescription,
}: {
  passiveEffect: OperatingRoundAction;
  sectorName: string;
  showDescription?: boolean;
}) => {
  const actionInfo = companyActionsDescription.find(
    (action) => action.name === passiveEffect
  );
  if (!actionInfo) return <div>No Effect Found.</div>;
  return (
    <Popover placement="top">
      <PopoverTrigger>
        <button
          type="button"
          className="flex flex-col gap-1 rounded-md p-2 max-w-[250px] cursor-pointer bg-transparent border-none text-left w-full"
          style={{
            backgroundColor: sectorColors[sectorName],
          }}
        >
          <RiGameFill />
          <span>{actionInfo.title}</span>
          {showDescription && <span>{actionInfo.message}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className={tooltipStyle}>
        <p className={tooltipParagraphStyle}>{actionInfo.message}</p>
      </PopoverContent>
    </Popover>
  );
};
export default PassiveEffect;
