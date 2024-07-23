"use client";

import { trpc } from "@sectors/app/trpc";
import { useEffect, useState } from "react";
import RoomListItem from "./RoomList";
import { RoomWithUsers } from "@server/prisma/prisma.types";
import { notFound } from "next/navigation";
import Button from "@sectors/app/components/General/DebounceButton";
import CreateRoom from "./CreateRoom";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { useAuthUser } from "../AuthUser.context";

export default function RoomBrowser() {
  const { user } = useAuthUser();
  const {
    data: rooms,
    isLoading,
    error,
    refetch,
  } = trpc.room.listRooms.useQuery({});
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between content-center my-4">
        <h1 className="text-2xl font-bold">Rooms</h1>
        <Button color="primary" onClick={handleRefresh}>
          <ArrowPathIcon className="size-4" />
        </Button>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search rooms..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full p-2 border border-gray-300 rounded text-slate-900"
        />
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
