import { trpc } from "@sectors/app/trpc";
import ShareComponent from "./Share";
import { Player, ShareLocation } from "@server/prisma/prisma.client";
import { ShareWithRelations } from "@server/prisma/prisma.types";
import { RiUserFill } from "@remixicon/react";
import { Popover, PopoverContent, PopoverTrigger } from "@nextui-org/react";
import PlayerAvatar from "../Player/PlayerAvatar";

const ShareHolders = ({
  companyId,
  isMinimal,
}: {
  companyId: string;
  isMinimal?: boolean;
}) => {
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
  }, {} as { [key: string]: ShareWithRelations[] });

  // Split location PLAYER by player id
  const playerShares = shareGroups[ShareLocation.PLAYER] || [];
  const playerSharesByPlayerId: {
    [key: string]: ShareWithRelations[];
  } = playerShares.reduce((acc, share) => {
    if (!share.playerId) {
      return acc;
    }
    if (!acc[share.playerId!]) {
      acc[share.playerId!] = [];
    }
    acc[share.playerId!].push(share);
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
      {isMinimal ? (
        <Popover>
          <PopoverTrigger>
            <div className="flex justify-center items-center cursor-pointer">
              <ShareComponent
                name="Player"
                icon={<RiUserFill className={"text-slate-800"} size={18} />}
                quantity={playerShares.length}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent>
            <div className="flex flex-wrap gap-1">
              {Object.values(
                playerShares
                  .filter((share) => share.location === ShareLocation.PLAYER)
                  .reduce((acc, share) => {
                    const playerId = share.Player?.id;
                    if (playerId && share.Player) {
                      if (!acc[playerId]) {
                        acc[playerId] = {
                          quantity: 0,
                          Player: share.Player,
                        };
                      }
                      acc[playerId].quantity += 1; // Sum the quantity for each player
                    }
                    return acc;
                  }, {} as Record<string, { quantity: number; Player: Player }>) // Accumulate by player ID
              ).map((shareData, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="flex items-center">
                    {shareData.Player && (
                      <PlayerAvatar player={shareData.Player} />
                    )}
                  </div>
                  <span>{shareData.quantity}</span>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default ShareHolders;
