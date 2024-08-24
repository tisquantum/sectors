import React from "react";
import GameComponent from "@sectors/app/components/Game/Game";
import { GameProvider } from "@sectors/app/components/Game/GameContext";
import { DrawerProvider } from "@sectors/app/components/Drawer.context";

export default async function GamePage({
  params,
}: {
  params: { slug: string };
}) {
  const gameId = params.slug;

  return (
    <GameProvider gameId={gameId}>
      <DrawerProvider>
        <GameComponent gameId={gameId} />
      </DrawerProvider>
    </GameProvider>
  );
}
