import { Badge, Tooltip } from "@nextui-org/react";
import { PrestigeTrack, PrestigeTrackItem } from "@server/data/constants";
import { createPrestigeTrackBasedOnSeed } from "@server/data/helpers";
import { PrestigeReward } from "@server/prisma/prisma.client";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useGame } from "./GameContext";
import PrestigeIcon from "./PrestigeIcon";
import { RiSparkling2Fill } from "@remixicon/react";
import {
  baseToolTipStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";
interface PrestigeRewardsProps {
  layout?: "minimalist" | "grid";
  onlyShowCurrent?: boolean; // New optional prop
}

const PrestigeRewards: React.FC<PrestigeRewardsProps> = ({
  layout = "grid",
  onlyShowCurrent = false, // Default to false
}) => {
  const { gameId, gameState } = useGame();
  const prestigeTrack = createPrestigeTrackBasedOnSeed(gameId);

  const renderCapitalInjection = (index: number, reward: PrestigeTrackItem) => {
    const capitalRewards = gameState.capitalInjectionRewards || [];
    const relativeIndex = prestigeTrack
      .slice(0, index)
      .filter((item) => item.type === PrestigeReward.CAPITAL_INJECTION).length;
    const capitalReward = capitalRewards[relativeIndex];

    if (capitalReward > 0) {
      return <div className="text-base">${capitalReward}</div>;
    }
    return null;
  };

  return (
    <div
      className={`flex flex-row w-full items-center overflow-x-auto gap-3 p-6 bg-gray-800 rounded-lg shadow-md lg:grid lg:grid-cols-3 lg:gap-6`}
    >
      {prestigeTrack.map((reward, index) => {
        // Conditional rendering based on `onlyShowCurrent`
        if (onlyShowCurrent && (gameState.nextPrestigeReward || 0) !== index) {
          return null; // Skip rendering if this is not the current reward
        }

        return (
          <Tooltip
            key={index}
            content={
              <div className="flex flex-col">
                <span>{reward.name}</span>
                <p>{reward.description}</p>
              </div>
            }
            classNames={{ base: baseToolTipStyle }}
            className={tooltipStyle}
          >
            <motion.div
              className={`${
                layout === "grid"
                  ? "flex flex-col items-center p-3 bg-gray-700 rounded-lg text-white hover:bg-gray-600"
                  : "flex flex-col items-center p-3 text-white"
              } ${
                (gameState.nextPrestigeReward || 0) === index &&
                "ring-2 ring-blue-500"
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex gap-2 items-center">
                <div className="w-6 h-6">
                  <PrestigeIcon prestigeType={reward.type} />
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1 text-sm lg:text-base">
                    <RiSparkling2Fill className="ml-2 size-4 text-yellow-500" />{" "}
                    {reward.cost}
                  </div>
                  {reward.type == PrestigeReward.CAPITAL_INJECTION &&
                    renderCapitalInjection(index, reward)}
                </div>
              </div>
              {layout === "grid" && (
                <div className="mt-2 text-center text-sm lg:text-base">
                  {reward.name}
                </div>
              )}
            </motion.div>
          </Tooltip>
        );
      })}
    </div>
  );
};

export default PrestigeRewards;
