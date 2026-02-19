import { Avatar, Badge, BadgeProps, Popover, PopoverContent, PopoverTrigger } from "@nextui-org/react";
import { lorelei } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import React, { useMemo } from "react";

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
  badgeIsOneChar,
  badgePlacement,
  size = "md",
}: {
  user: { name: string };
  showNameLabel?: boolean;
  badgeContent?: number | string | React.ReactNode;
  badgeIsOneChar?: BadgeProps["isOneChar"];
  badgePlacement?: BadgeProps["placement"];
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
  }, [user.name, size]);

  return (
    <div className="flex flex-col items-center">
      <Popover placement="bottom">
        <PopoverTrigger>
          <div className="flex items-center cursor-pointer">
            {badgeContent ? (
              <Badge
                color="secondary"
                content={badgeContent}
                isOneChar={badgeIsOneChar}
                placement={badgePlacement}
              >
                <Avatar size={size} name={user.name} src={avatar} />
              </Badge>
            ) : (
              <Avatar size={size} name={user.name} src={avatar} />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="bg-slate-800 border border-gray-700 p-3">
          <span className="text-sm">{user.name}</span>
        </PopoverContent>
      </Popover>
      {showNameLabel && <span>{user.name}</span>}
    </div>
  );
};

export default UserAvatar;
