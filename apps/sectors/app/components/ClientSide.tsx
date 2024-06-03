"use client";

import { trpc } from "@sectors/app/trpc";
import { useEffect, useState } from "react";
import { Room } from "@server/prisma/prisma.client";
import RoomComponent from "./Room";

export default function ClientSide() {
  const [rooms, setRooms] = useState<Room[]>([]);
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
      <h1>Rooms</h1>
      <div className="grid grid-flow-row auto-rows-max">
        {rooms.map((room) => (
          <RoomComponent room={room} key={room.id} />
        ))}
      </div>
    </div>
  );
}
