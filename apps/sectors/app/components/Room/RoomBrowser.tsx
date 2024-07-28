"use client";

import { trpc } from "@sectors/app/trpc";
import { useEffect, useState } from "react";
import RoomListItem from "./RoomList";
import { RoomWithUsers } from "@server/prisma/prisma.types";
import { notFound } from "next/navigation";
import Button from "@sectors/app/components/General/DebounceButton";
import CreateRoom from "./CreateRoom";
import { ArrowPathIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import { useAuthUser } from "../AuthUser.context";
import { Chip } from "@nextui-org/react";
import { GameStatus } from "@server/prisma/prisma.client";
import { renderGameStatusColor } from "@sectors/app/helpers";
import {
  RiCheckboxCircleFill,
  RiCheckFill,
  RiCloseCircleFill,
} from "@remixicon/react";
import DebounceButton from "@sectors/app/components/General/DebounceButton";

export default function RoomBrowser() {
  const { user } = useAuthUser();
  const {
    data: rooms,
    isLoading,
    error,
    refetch,
  } = trpc.room.listRooms.useQuery({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<GameStatus | null>(
    GameStatus.ACTIVE
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  if (rooms == undefined) {
    return notFound();
  }

  const handleRefresh = () => {
    refetch();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleChipClick = (status: GameStatus) => {
    setSelectedStatus(status);
  };

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus
      ? room.game?.[0]?.gameStatus === selectedStatus
      : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between content-center my-4">
        <h1 className="text-2xl font-bold">Rooms</h1>
        <Button color="primary" onClick={handleRefresh}>
          <ArrowPathIcon className="size-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.values(GameStatus).map((status, index) => (
          <Chip
            startContent={selectedStatus === status && <RiCheckboxCircleFill />}
            key={index}
            color={renderGameStatusColor(status)}
            onClick={() => handleChipClick(status)}
          >
            {status}
          </Chip>
        ))}
      </div>
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Search rooms..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full p-2 border border-gray-300 rounded text-slate-900"
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-2 inset-y-0 m-auto text-gray-500 hover:text-gray-700"
          >
            <RiCloseCircleFill />
          </button>
        )}
      </div>
      <div className="grid grid-flow-row auto-rows-max">
        {filteredRooms.map((room) => (
          <RoomListItem room={room} key={room.id} />
        ))}
      </div>
      {user && <CreateRoom />}
    </div>
  );
}
