import PlayerShares from "./PlayerShares";
import { Card, CardFooter, CardHeader } from "@nextui-org/react";
import PlayerAvatar from "./PlayerAvatar";
import WalletInfo from "../Game/WalletInfo";
import { calculateNetWorth } from "@server/data/helpers";
import { RiCurrencyFill, RiSafe2Fill, RiScalesFill } from "@remixicon/react";
import { PlayerWithShares } from "@server/prisma/prisma.types";

const PlayerOverview = ({
  playerWithShares,
}: {
  playerWithShares: PlayerWithShares;
}) => (
  <Card className="p-2 max-w-[500px]">
    <CardHeader>
      <div className="flex items-center gap-2">
        <PlayerAvatar player={playerWithShares} size="lg" />
        <div className="flex items-center gap-4">
          <div>
            <h2>{playerWithShares.nickname}</h2>
            <div className="flex gap-2">
              <span className="flex items-center content-center">
                <WalletInfo player={playerWithShares} />
              </span>
              <span className="flex items-center content-center">
                <RiCurrencyFill className="h-6 w-6" /> $
                {calculateNetWorth(0, playerWithShares.Share)}
              </span>
              <span className="flex items-center content-center">
                <RiScalesFill className="h-6 w-6" /> $
                {calculateNetWorth(
                  playerWithShares.cashOnHand,
                  playerWithShares.Share
                )}
              </span>
              {playerWithShares.marginAccount > 0 && (
                <span className="flex items-center content-center">
                  <RiSafe2Fill size={18} /> ${playerWithShares.marginAccount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </CardHeader>
    <CardFooter>
      <PlayerShares playerWithShares={playerWithShares} />
    </CardFooter>
  </Card>
);

export default PlayerOverview;
