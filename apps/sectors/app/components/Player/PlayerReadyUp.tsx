'use client';
import React, { useEffect, useState } from 'react';
import { Avatar, AvatarGroup, Card } from '@nextui-org/react';
import { trpc } from '@sectors/app/trpc';
import Button from "@sectors/app/components/General/DebounceButton";
interface Player {
  id: string;
  nickname: string;
}

interface ReadyUpProps {
  gameId?: string;
}

const ReadyUp: React.FC<ReadyUpProps> = () => {
  const gameId = 'G1';
  const [players, setPlayers] = useState<Player[]>([]);
  const [readyStatus, setReadyStatus] = useState<Map<string, boolean>>(new Map());

  // Fetch players and their readiness status
  useEffect(() => {
    const fetchPlayers = async () => {
      const fetchedPlayers = await trpc.player.listPlayers.query({ where: { gameId } });
      setPlayers(fetchedPlayers);

      const readiness = await Promise.all(
        fetchedPlayers.map(async (player: Player) => {
          const { allReady } = await trpc.player.areAllPlayersReady.query({ gameId });
          return { id: player.id, ready: allReady };
        })
      );

      const readyStatusMap = new Map<string, boolean>();
      readiness.forEach(({ id, ready }) => readyStatusMap.set(id, ready));
      setReadyStatus(readyStatusMap);
    };

    fetchPlayers();
  }, [gameId]);

  // Mark a player as ready
  const handleReadyUp = async (playerId: string) => {
    await trpc.player.playerReady.mutate({ playerId, gameId });
    setReadyStatus(new Map(readyStatus.set(playerId, true)));
  };

  return (
    <Card>
      <AvatarGroup isBordered isGrid>
        {players.map((player) => (
          <div key={player.id} className="text-center">
            <Avatar
              name={player.nickname}
              color={readyStatus.get(player.id) ? 'success' : 'danger'}
              isBordered
            />
            <div className="text-sm mt-1">{player.nickname}</div>
            <Button
              onClick={() => handleReadyUp(player.id)}
              disabled={readyStatus.get(player.id)}
            >
              Ready Up
            </Button>
          </div>
        ))}
      </AvatarGroup>
    </Card>
  );
};

export default ReadyUp;
