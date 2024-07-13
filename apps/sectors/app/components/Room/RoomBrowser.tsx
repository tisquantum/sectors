"use client";

import { trpc } from "@sectors/app/trpc";
import { useEffect, useState } from "react";
import RoomList from "./RoomList";
import { RoomWithUsers } from "@server/prisma/prisma.types";
import { notFound } from "next/navigation";
import Button from "@sectors/app/components/General/DebounceButton";
import CreateRoom from "./CreateRoom";
import { ArrowPathIcon } from "@heroicons/react/24/solid";

export default function RoomBrowser() {
  const { data: rooms, isLoading, error, refetch } = trpc.room.listRooms.useQuery({});
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if(error) {
    return <div>Error: {error.message}</div>;
  }
  if (rooms == undefined) {
    return notFound();
  }

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between content-center my-4">
        <h1 className="text-2xl font-bold">Rooms</h1>
        <Button color="primary" onClick={handleRefresh}>
          <ArrowPathIcon className="size-4" />
        </Button>
      </div>
      <div className="grid grid-flow-row auto-rows-max">
        {rooms.map((room) => (
          <RoomList room={room} key={room.id} />
        ))}
      </div>
      <CreateRoom />
    </div>
  );
}
