import React from "react";
import GameComponent from "@sectors/app/components/Game/Game";

export default async function GamePage ({ params }: { params: { slug: string } }) {
  const gameId = params.slug;

  return <GameComponent gameId={gameId} />;
};
