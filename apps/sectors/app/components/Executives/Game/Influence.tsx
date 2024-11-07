import { Avatar, Badge } from "@nextui-org/react";

const Influence = ({ influenceCount }: { influenceCount: number }) => {
  return (
    <Badge content={influenceCount.toString()} color="secondary">
      <Avatar color="warning" />
    </Badge>
  );
};

export default Influence;
