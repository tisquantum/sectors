import React from "react";
import GameComponent from "@sectors/app/components/Game/Game";
import { GameProvider } from "@sectors/app/components/Game/GameContext";

export default async function GamePage({
  params,
}: {
  params: { slug: string };
}) {
  const gameId = params.slug;

  return (
    <GameProvider gameId={gameId}>
      <GameComponent gameId={gameId} />
    </GameProvider>
  );
}
