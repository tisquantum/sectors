import GameBoard from "@sectors/app/components/Executives/Game/GameBoard";
import React from "react";

export default async function GamePage({
  params,
}: {
  params: { slug: string };
}) {
  const gameId = params.slug;

  return (
    <div className="h-[100vh] w-full overflow-y-auto">
      <GameBoard gameId={gameId} />
    </div>
  );
}
