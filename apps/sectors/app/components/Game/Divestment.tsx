import { DEFAULT_SHARE_LIMIT } from "@server/data/constants";
import PlayerAvatar from "../Player/PlayerAvatar";
import PlayerShares from "../Player/PlayerShares";
import { useGame } from "./GameContext";
import { trpc } from "@sectors/app/trpc";
import {
  TransactionSubType,
  TransactionType,
} from "@server/prisma/prisma.client";
import ShareComponent from "../Company/Share";

const Divestment = () => {
  const { playersWithShares, gameState } = useGame();
  const {
    data: shareTransactionsDivestment,
    isLoading,
    isError,
  } = trpc.transactions.listTransactions.useQuery({
    where: {
      transactionType: TransactionType.SHARE,
      transactionSubType: TransactionSubType.DIVESTMENT,
      GameTurn: {
        id: gameState.currentTurn,
      },
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error...</div>;

  return (
    <div>
      <h1 className="text-2xl">Divestment</h1>
      <p>
        Any player who exceeds the share limit must divest down to the limit.
        The share limit is {DEFAULT_SHARE_LIMIT}. This process is conducted at
        random and players have no agency in which shares will be divested.
      </p>
      <div className="flex flex-wrap gap-4 p-4">
        {!shareTransactionsDivestment ? (
          <div className="p-4 border rounded-lg shadow-md w-full max-w-sm">
            <p>No divestment transactions to show.</p>
          </div>
        ) : (
          playersWithShares.map((player) => {
            // Filter transactions for this player
            const playerTransactions = shareTransactionsDivestment.filter(
              (transaction) => transaction.fromEntityId === player.entityId
            );

            return (
              <div
                key={player.id}
                className="p-4 border rounded-lg shadow-md w-full max-w-sm"
              >
                <div className="flex flex-col items-center gap-2">
                  {playerTransactions.length > 0 ? (
                    <>
                      <PlayerAvatar player={player} showNameLabel />
                      {playerTransactions.map((transaction) => (
                        <ShareComponent
                          key={transaction.id}
                          name={
                            gameState.Company.find((company) => {
                              company.id === transaction.companyInvolvedId;
                            })?.name || "Unknown Company"
                          }
                          quantity={transaction.amount} // Assuming `amount` is the number of shares divested
                        />
                      ))}
                    </>
                  ) : (
                    <p>No divestment for this player.</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Divestment;
