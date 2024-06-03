// components/Sidebar.tsx
import React from "react";
import { Room, User } from "@server/prisma/prisma.client";
import { Avatar, Button } from "@nextui-org/react";
import { trpc } from "@sectors/app/trpc";

interface SidebarProps {
  users: User[];
  room: Room;
}

const Sidebar: React.FC<SidebarProps> = ({ users, room}) => {
  const handleJoin = (roomId: number) => {
    trpc.roomUser.joinRoom.mutate({
      roomId,
      userId: "3a169655-aa35-47ce-b55f-6277f2e11c4a",
    });
  };

  const handleLeave = (roomId: number) => {
    trpc.roomUser.leaveRoom.mutate({
      roomId,
      userId: "3a169655-aa35-47ce-b55f-6277f2e11c4a",
    });
  };
  return (
    <div className="w-1/4 bg-gray-800 text-white p-6 flex flex-col">
      <div className="mb-6">
        <Button color="primary" onClick={() => handleLeave(room.id)} className="mb-4 w-full">
          Leave
        </Button>
        <Button color="primary" onClick={() => handleJoin(room.id)} className="w-full">
          Join
        </Button>
      </div>
      <ul className="flex-1 overflow-y-auto">
        {users.map((user) => (
          <li key={user.id} className="flex items-center mb-4">
            <Avatar name={user.name} size="sm" className="mr-2" />
            <span>{user.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
