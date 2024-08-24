import { Tooltip } from "@nextui-org/react";
import { RiGameFill } from "@remixicon/react";
import {
  tooltipParagraphStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";
import { companyActionsDescription } from "@server/data/constants";
import { sectorColors } from "@server/data/gameData";
import { OperatingRoundAction, SectorName } from "@server/prisma/prisma.client";

const PassiveEffect = ({
  passiveEffect,
  sectorName,
}: {
  passiveEffect: OperatingRoundAction;
  sectorName: string;
}) => {
  const actionInfo = companyActionsDescription.find(
    (action) => action.name === passiveEffect
  );
  if (!actionInfo) return <div>No Effect Found.</div>;
  return (
    <Tooltip
      className={tooltipStyle}
      content={<p className={tooltipParagraphStyle}>{actionInfo.message}</p>}
    >
      <div
        className="flex flex-col gap-1 rounded-md p-2"
        style={{
          backgroundColor: sectorColors[sectorName],
        }}
      >
        <RiGameFill />
        <span>{actionInfo.title}</span>
      </div>
    </Tooltip>
  );
};
export default PassiveEffect;
