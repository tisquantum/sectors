import PlayerShares from "./PlayerShares";
import { Card, CardFooter, CardHeader, Tooltip } from "@nextui-org/react";
import {
  baseToolTipStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";
import PlayerAvatar from "./PlayerAvatar";
import WalletInfo from "../Game/WalletInfo";
import { calculateNetWorth } from "@server/data/helpers";
import { RiCurrencyFill, RiSafe2Fill, RiScalesFill } from "@remixicon/react";
import { PlayerWithShares } from "@server/prisma/prisma.types";
import { ReactNode } from "react";

function FinancialHint({
  hideTooltips,
  content,
  children,
}: {
  hideTooltips?: boolean;
  content: ReactNode;
  children: ReactNode;
}) {
  const inner = (
    <span className="flex items-center content-center">{children}</span>
  );
  if (hideTooltips) return inner;
  return (
    <Tooltip
      classNames={{ base: baseToolTipStyle }}
      className={tooltipStyle}
      content={content}
    >
      {inner}
    </Tooltip>
  );
}

const PlayerOverview = ({
  playerWithShares,
  hideFinancialTooltips,
}: {
  playerWithShares: PlayerWithShares;
  hideFinancialTooltips?: boolean;
}) => (
  <Card className="p-2 max-w-[500px]">
    <CardHeader>
      <div className="flex items-center gap-2">
        <PlayerAvatar player={playerWithShares} size="lg" />
        <div className="flex items-center gap-4">
          <div>
            <h2>{playerWithShares.nickname}</h2>
            <div className="flex gap-2">
              <FinancialHint
                hideTooltips={hideFinancialTooltips}
                content={<p>Cash on hand.</p>}
              >
                <WalletInfo player={playerWithShares} />
              </FinancialHint>
              <FinancialHint
                hideTooltips={hideFinancialTooltips}
                content={
                  <p>Portfolio value: the total value of all shares owned.</p>
                }
              >
                <RiCurrencyFill className="h-6 w-6" /> $
                {calculateNetWorth(0, playerWithShares.Share)}
              </FinancialHint>
              <FinancialHint
                hideTooltips={hideFinancialTooltips}
                content={
                  <p>
                    Net worth: The total value of all shares owned plus cash on
                    hand.
                  </p>
                }
              >
                <RiScalesFill className="h-6 w-6" /> $
                {calculateNetWorth(
                  playerWithShares.cashOnHand,
                  playerWithShares.Share
                )}
              </FinancialHint>
              {playerWithShares.marginAccount > 0 && (
                <FinancialHint
                  hideTooltips={hideFinancialTooltips}
                  content={
                    <p>
                      Margin account balance. This balance is locked for short
                      orders until they are covered. It cannot be used for any
                      other purpose until then.
                    </p>
                  }
                >
                  <RiSafe2Fill size={18} /> ${playerWithShares.marginAccount}
                </FinancialHint>
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
