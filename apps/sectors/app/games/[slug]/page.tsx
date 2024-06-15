import React from "react";
import GameComponent from "@sectors/app/components/Game/Game";

const GamePage = ({ params }: { params: { slug: string } }) => {
  return <GameComponent />;
};

export default GamePage;
