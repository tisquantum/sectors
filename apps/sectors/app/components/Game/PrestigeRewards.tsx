import { identicon, rings } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { Tooltip } from "@nextui-org/react";
import { PrestigeTrack } from "@server/data/constants";
import { createPrestigeTrackBasedOnSeed } from "@server/data/helpers";
import { PrestigeReward } from "@server/prisma/prisma.client";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useGame } from "./GameContext";

const PrestigeIcon = ({
  prestigeType,
}: {
  prestigeType: PrestigeReward | undefined;
}) => {
  const icon = useMemo(() => {
    return createAvatar(identicon, {
      size: 64,
      seed: prestigeType || "default",
    }).toDataUri();
  }, []);
  return <img src={icon} alt={prestigeType} className="w-full h-full" />;
};
interface PrestigeRewardsProps {
  layout?: "minimalist" | "grid";
}

const PrestigeRewards: React.FC<PrestigeRewardsProps> = ({
  layout = "grid",
}) => {
  const { gameId, gameState } = useGame();
  const prestigeTrack = createPrestigeTrackBasedOnSeed(gameId);

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
            <div className="w-6 h-6">
              <PrestigeIcon prestigeType={reward.type} />
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
