import { trpc } from "@sectors/app/trpc";
import ShareComponent from "./Share";
import { ShareLocation } from "@server/prisma/prisma.client";
import { ShareWithRelations } from "@server/prisma/prisma.types";

const ShareHolders = ({ companyId }: { companyId: string }) => {
  const { data: companyShares, isLoading } =
    trpc.share.listSharesWithRelations.useQuery({
      where: { companyId },
    });

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!companyShares) {
    return <div>No shares found</div>;
  }

  // Group shares by location
  const shareGroups = companyShares.reduce((acc, share) => {
    if (!acc[share.location]) {
      acc[share.location] = [];
    }
    acc[share.location].push(share);
    return acc;
  }, {} as { [key: string]: any[] });

  // Split location PLAYER by player id
  const playerShares = shareGroups[ShareLocation.PLAYER] || [];
  const playerSharesByPlayerId: {
    [key: string]: ShareWithRelations[];
  } = playerShares.reduce((acc, share) => {
    if (!acc[share.playerId]) {
      acc[share.playerId] = [];
    }
    acc[share.playerId].push(share);
    return acc;
  }, {} as { [key: string]: ShareWithRelations[] });

  return (
    <div className="flex flex-wrap justify-start gap-2">
      <ShareComponent
        name="OM"
        quantity={shareGroups[ShareLocation.OPEN_MARKET]?.length || 0}
      />
      <ShareComponent
        name="IPO"
        quantity={shareGroups[ShareLocation.IPO]?.length || 0}
      />
      {Object.entries(playerSharesByPlayerId).map(([playerId, shares]) => {
        if (shares[0].Player == null) {
          return null;
        } else {
          return (
            <ShareComponent
              key={playerId}
              name={shares[0].Player?.nickname || "Unknown Player"}
              quantity={shares.length}
              player={shares[0].Player}
            />
          );
        }
      })}
    </div>
  );
};

export default ShareHolders;
