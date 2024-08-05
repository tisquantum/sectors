import { Badge, Tooltip } from "@nextui-org/react";
import { PrestigeTrack } from "@server/data/constants";
import { createPrestigeTrackBasedOnSeed } from "@server/data/helpers";
import { PrestigeReward } from "@server/prisma/prisma.client";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useGame } from "./GameContext";
import PrestigeIcon from "./PrestigeIcon";
import { RiSparkling2Fill } from "@remixicon/react";
interface PrestigeRewardsProps {
  layout?: "minimalist" | "grid";
}

const PrestigeRewards: React.FC<PrestigeRewardsProps> = ({
  layout = "grid",
}) => {
  const { gameId, gameState } = useGame();
  const prestigeTrack = createPrestigeTrackBasedOnSeed(gameId);
  const renderCapitalInjection = (index: number) => {
    const capitalRewards = gameState.capitalInjectionRewards || [];

    // Filter out all rewards of type CAPITAL_INJECTION
    const capitalInjectionRewards = prestigeTrack.filter(
      (reward) => reward.type === PrestigeReward.CAPITAL_INJECTION
    );

    // Find the relative index of the current reward in the filtered array
    const relativeIndex = capitalInjectionRewards.findIndex(
      (_, i) => i === index
    );

    // Get the capital reward value at the relative index
    const capitalReward = capitalRewards[relativeIndex];

    if (capitalReward > 0) {
      return <div>${capitalReward}</div>;
    }
    return null;
  };

  return (
    <div
      className={`p-6 bg-gray-800 rounded-lg shadow-md ${
        layout === "grid"
          ? "grid grid-cols-3 gap-6"
          : "flex flex-row items-center overflow-x-scroll gap-3"
      }`}
    >
      {prestigeTrack.map((reward, index) => (
        <Tooltip
          key={index}
          content={
            <div className="flex flex-col">
              <span>{reward.name}</span>
              <p>{reward.description}</p>
            </div>
          }
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
            <div className="flex gap-1">
              <div className="w-6 h-6">
                <PrestigeIcon prestigeType={reward.type} />
              </div>
              <div className="flex gap-1">
                <RiSparkling2Fill className="ml-2 size-4 text-yellow-500" />{" "}
                {reward.cost}
              </div>
              {reward.name == PrestigeReward.CAPITAL_INJECTION &&
                renderCapitalInjection(index)}
            </div>
            {layout === "grid" && (
              <div className="mt-2 text-center text-md">{reward.name}</div>
            )}
          </motion.div>
        </Tooltip>
      ))}
    </div>
  );
};

export default PrestigeRewards;
