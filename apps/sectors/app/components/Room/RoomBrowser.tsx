"use client";

import { trpc } from "@sectors/app/trpc";
import { useEffect, useState } from "react";
import RoomList from "./RoomList";
import { RoomWithUsers } from "@server/prisma/prisma.types";

export default function RoomBrowser() {
  const [rooms, setRooms] = useState<RoomWithUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const rooms = await trpc.room.listRooms.query({});
        setRooms(rooms);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto">
    <h1 className="text-2xl font-bold mb-4">Rooms</h1>
    <div className="grid grid-flow-row auto-rows-max">
      {rooms.map((room) => (
        <RoomList room={room} key={room.id} />
      ))}
    </div>
  </div>
  );
}
