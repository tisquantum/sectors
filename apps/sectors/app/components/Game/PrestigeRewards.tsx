import { identicon, rings } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { Tooltip } from "@nextui-org/react";
import { PrestigeTrack } from "@server/data/constants";
import { PrestigeReward } from "@server/prisma/prisma.client";
import { motion } from "framer-motion";
import { useMemo } from "react";

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
const PrestigeRewards = () => {
  return (
    <div className="grid grid-cols-3 items-center justify-center p-6 gap-6 bg-gray-800 rounded-lg shadow-md">
      {PrestigeTrack.map((reward, index) => (
        <Tooltip key={index} content={reward.description}>
          <motion.div
            className="flex flex-col items-center p-3 bg-gray-700 rounded-lg text-white hover:bg-gray-600"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-6 h-6">
              <PrestigeIcon prestigeType={reward.type} />
            </div>
            <div className="mt-2 text-center text-md">{reward.name}</div>
          </motion.div>
        </Tooltip>
      ))}
    </div>
  );
};

export default PrestigeRewards;
