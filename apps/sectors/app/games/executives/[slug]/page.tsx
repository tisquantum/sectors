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
        <div className="relative flex flex-col gap-2 my-2">
          <div className="relative xl:absolute xl:top-0 xl:left-2">
            <GameTopBar />
          </div>
          <GameBoard gameId={gameId} />
        </div>
      </GameProvider>
    </div>
  );
}
