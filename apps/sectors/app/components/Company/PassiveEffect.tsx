import { Tooltip } from "@nextui-org/react";
import { RiGameFill } from "@remixicon/react";
import {
  baseToolTipStyle,
  tooltipParagraphStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";
import { companyActionsDescription } from "@server/data/constants";
import { sectorColors } from "@server/data/gameData";
import { OperatingRoundAction, SectorName } from "@server/prisma/prisma.client";

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
    <Tooltip
      classNames={{ base: baseToolTipStyle }}
      className={tooltipStyle}
      content={<p className={tooltipParagraphStyle}>{actionInfo.message}</p>}
    >
      <div
        className="flex flex-col gap-1 rounded-md p-2 max-w-[250px]"
        style={{
          backgroundColor: sectorColors[sectorName],
        }}
      >
        <RiGameFill />
        <span>{actionInfo.title}</span>
        {showDescription && <span>{actionInfo.message}</span>}
      </div>
    </Tooltip>
  );
};
export default PassiveEffect;
