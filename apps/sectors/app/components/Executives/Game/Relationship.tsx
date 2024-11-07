import { Avatar } from "@nextui-org/react";
import { RiUser2Fill } from "@remixicon/react";

const Relationship = () => {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center relative">
        <Avatar size="md" color="primary" icon={<RiUser2Fill />} />
        <div className="absolute top-1/2 left-full w-10 h-0.5 bg-gray-300 dotted-line"></div>
      </div>

      <div className="flex items-center relative">
        <Avatar size="md" color="primary" icon={<RiUser2Fill />} />
        <div className="absolute top-1/2 left-full w-10 h-0.5 bg-gray-300 dotted-line"></div>
      </div>

      <div className="flex items-center relative">
        <Avatar name="+3" />
      </div>
    </div>
  );
};

export default Relationship;
