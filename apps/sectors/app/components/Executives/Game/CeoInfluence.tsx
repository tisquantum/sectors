import { trpc } from "@sectors/app/trpc";
import { useExecutiveGame } from "./GameContext";
import { InfluenceLocation, InfluenceType } from "@server/prisma/prisma.client";
import { Avatar, Badge } from "@nextui-org/react";
import { useEffect } from "react";

export const CeoInfluence = () => {
  const { gameId, pingCounter, currentPhase } = useExecutiveGame();
  const {
    data: ceoInfluence,
    isLoading,
    isError,
    refetch,
  } = trpc.executiveInfluence.listInfluences.useQuery({
    where: {
      gameId,
      influenceType: InfluenceType.CEO,
      influenceLocation: InfluenceLocation.CEO,
    },
  });
  useEffect(() => {
    refetch();
  }, [pingCounter, currentPhase?.id, refetch]);
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error</div>;
  }
  if (!ceoInfluence) {
    return <div>No CEO influence found</div>;
  }
  return (
    <Badge
      color="success"
      size="lg"
      content={ceoInfluence.length.toString()}
      className="mr-2"
    >
      <Avatar name="CEO" size="lg" />
    </Badge>
  );
};
