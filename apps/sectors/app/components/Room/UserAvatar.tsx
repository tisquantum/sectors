import { Avatar, Badge, Tooltip } from "@nextui-org/react";
import { Player, User } from "@server/prisma/prisma.client";
import { lorelei } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { useMemo } from "react";

function hashStringToColor(str: string): string {
  // Simple hash function to generate a consistent hash from a string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert hash to a hex color
  let color = "";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).slice(-2);
  }

  return color;
}

const UserAvatar = ({
  user,
  showNameLabel,
  badgeContent,
  size = "md",
}: {
  user: User;
  showNameLabel?: boolean;
  badgeContent?: number | string;
  size?: "sm" | "md" | "lg" | undefined;
}) => {
  const getSize = (size: "sm" | "md" | "lg" | undefined) => {
    switch (size) {
      case "sm":
        return 32;
      case "md":
        return 64;
      case "lg":
        return 128;
      default:
        return 128;
    }
  };
  const avatar = useMemo(() => {
    return createAvatar(lorelei, {
      size: getSize(size),
      seed: user.name,
      backgroundColor: [hashStringToColor(user.name)],
    }).toDataUri();
  }, []);

  return (
    <div className="flex flex-col items-center">
      <Tooltip content={user.name}>
        <div className="flex items-center">
          {badgeContent ? (
            <Badge color="secondary" content={badgeContent}>
              <Avatar size={size} name={user.name} src={avatar} />
            </Badge>
          ) : (
            <Avatar size={size} name={user.name} src={avatar} />
          )}
        </div>
      </Tooltip>
      {showNameLabel && <span>{user.name}</span>}
    </div>
  );
};

export default UserAvatar;
