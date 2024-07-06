import { Divider } from "@nextui-org/react";
import { Share } from "@server/prisma/prisma.client";
import React from "react";

const ShareComponent = ({
  name,
  quantity,
  icon,
}: {
  name: string;
  quantity: number;
  icon?: React.ReactNode;
}) => {
  return (
    <div className="flex items-center justify-between bg-slate-200 shadow-lg rounded-lg px-1.5 py-0.5 max-w-sm mx-auto">
      {icon ? (
        icon
      ) : (
        <div className="text-md font-semibold text-slate-900">{name}</div>
      )}
      <div className="border-l border-slate-900 mx-1 h-4"></div>
      <div className="text-md font-bold text-violet-800">{quantity}</div>
    </div>
  );
};

export default ShareComponent;
