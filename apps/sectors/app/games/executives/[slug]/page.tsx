import GameBoard from "@sectors/app/components/Executives/Game/GameBoard";
import { GameProvider } from "@sectors/app/components/Executives/Game/GameContext";
import { GameTopBar } from "@sectors/app/components/Executives/Game/GameTopBar";
import React from "react";

export default async function GamePage({
  params,
}: {
  params: { slug: string };
}) {
  const gameId = params.slug;

  return (
    <div className="h-[100vh] w-full overflow-y-auto">
      <GameProvider gameId={gameId}>
        <div className="flex flex-col gap-2">
          <GameTopBar />
          <GameBoard gameId={gameId} />
        </div>
      </GameProvider>
    </div>
  );
}
