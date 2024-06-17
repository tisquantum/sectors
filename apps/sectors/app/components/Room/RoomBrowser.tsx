"use client";

import { trpc } from "@sectors/app/trpc";
import { useEffect, useState } from "react";
import RoomList from "./RoomList";
import { RoomWithUsers } from "@server/prisma/prisma.types";
import { notFound } from "next/navigation";
import { Button } from "@nextui-org/react";
import CreateRoom from "./CreateRoom";

export default function RoomBrowser() {
  const { data: rooms, isLoading } = trpc.room.listRooms.useQuery({});
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (rooms == undefined) {
    return notFound();
  }

  return (
    <div className="container mx-auto">
    <h1 className="text-2xl font-bold mb-4">Rooms</h1>
    <div className="grid grid-flow-row auto-rows-max">
      {rooms.map((room) => (
        <RoomList room={room} key={room.id} />
      ))}
    </div>
    <CreateRoom />
  </div>
  );
}
