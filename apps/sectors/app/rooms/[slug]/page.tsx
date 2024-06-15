'use client';

import RoomComponent from '@sectors/app/components/Room/Room';
import { trpc } from '@sectors/app/trpc';
import { notFound } from 'next/navigation';

export default function RoomPage({ params }: { params: { slug: string } }) {
  const roomId = parseInt(params.slug, 10);

  const { data: room, isLoading, isError, error } = trpc.room.getRoom.useQuery({ id: roomId });

  console.log('isLoading', isLoading);
  console.log('isError', isError);
  if (isError) {
    console.error('Error fetching room:', error);
    return <div>Error loading room</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (room == undefined) {
    return notFound();
  }

  return <RoomComponent room={room} />;
}
