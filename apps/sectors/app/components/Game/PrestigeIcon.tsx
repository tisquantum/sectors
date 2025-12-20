import { createAvatar } from "@dicebear/core";
import { identicon, rings } from "@dicebear/collection";
import { PrestigeReward } from "@server/prisma/prisma.client";
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
    }, [prestigeType]);
    return <img src={icon} alt={prestigeType} className="w-full h-full max-w-24" />;
  };

export default PrestigeIcon;