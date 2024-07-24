import { PrestigeTrack } from "@server/data/constants";
import { PrestigeReward, PrestigeRewards } from "@server/prisma/prisma.client";
import PrestigeIcon from "./PrestigeIcon";
import { RiSparkling2Fill } from "@remixicon/react";

const PrestigeRewardComponent = ({
  prestigeReward,
}: {
  prestigeReward: PrestigeRewards;
}) => {
  const prestigeRewardItem = PrestigeTrack.find(
    (reward) => reward.type === prestigeReward.reward
  );
  if (!prestigeRewardItem) {
    return null;
  }
  return (
    <div className="flex flex-col justify-center items-center">
      <PrestigeIcon prestigeType={prestigeReward.reward} />
      <span className="text-lg">{prestigeRewardItem.name}</span>
      <span className="text-md">{prestigeRewardItem.description}</span>
      <span className="text-md">
        <RiSparkling2Fill className="ml-2 size-4 text-yellow-500" />
        {prestigeRewardItem.cost}
      </span>
    </div>
  );
};

export default PrestigeRewardComponent;
