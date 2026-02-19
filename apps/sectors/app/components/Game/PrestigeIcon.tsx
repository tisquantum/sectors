import { createAvatar } from "@dicebear/core";
import { identicon, rings } from "@dicebear/collection";
import { PrestigeReward } from "@server/prisma/prisma.client";
import { useMemo } from "react";
import Image from "next/image";

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
    return <Image src={icon} alt={prestigeType ?? "Prestige"} className="w-full h-full max-w-24" width={64} height={64} unoptimized />;
  };

export default PrestigeIcon;