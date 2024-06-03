import RoomComponent from '@sectors/app/components/Room/Room';
import { trpc } from '@sectors/app/trpc';
import { notFound } from 'next/navigation';

async function getRoomData(roomId: number) {
  // Fetch room data using TRPC
  const room = await trpc.room.getRoom.query({ id: roomId });
  if (!room) {
    notFound();
  }
  return room;
}

export default async function RoomPage({ params }: { params: { slug: string } }) {
  const roomId = parseInt(params.slug, 10);
  const room = await getRoomData(roomId);

  return <RoomComponent room={room} />;
}
