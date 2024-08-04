import { RiExchangeBoxFill } from "@remixicon/react";
import { trpc } from "@sectors/app/trpc";
import { EntityType, Player, Transaction } from "@server/prisma/prisma.client";
import PlayerAvatar from "../Player/PlayerAvatar";
import { TransactionWithEntities } from "@server/prisma/prisma.types";

const TransactionHistory = ({
  transactions,
}: {
  transactions: TransactionWithEntities[];
}) => (
  <>
    {transactions?.map((transaction) => (
      <div
        key={transaction.id}
        className="flex items-center justify-between p-4 mb-2 shadow rounded-lg"
      >
        <div className="flex items-center">
          <div className="mr-4 text-2xl">
            <RiExchangeBoxFill />
          </div>
          <div>
            <div className="text-gray-400 flex items-center justify-start gap-2">
              <span>From</span>
              <div className="flex flex-col">
                {transaction.fromEntity.Player ? (
                  transaction.fromEntity.Player.nickname
                ) : transaction.fromEntity.Company ? (
                  <p>{transaction.fromEntity.Company.name}</p>
                ) : (
                  transaction.fromEntity.entityType && (
                    <p>{transaction.fromEntity.entityType}</p>
                  )
                )}
              </div>
            </div>
            <div className="text-gray-400 flex items-center justify-start gap-2">
              <span>To</span>
              <div className="flex flex-col">
                {transaction.toEntity.Player ? (
                  transaction.toEntity.Player.nickname
                ) : transaction.toEntity.Company ? (
                  <p>{transaction.toEntity.Company.name}</p>
                ) : (
                  transaction.toEntity.entityType && (
                    <p>{transaction.toEntity.entityType}</p>
                  )
                )}
              </div>
            </div>
            <p>Amount: ${transaction.amount.toFixed(2)}</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {new Date(transaction.timestamp).toLocaleDateString()}{" "}
          {new Date(transaction.timestamp).toLocaleTimeString()}
        </div>
      </div>
    ))}
  </>
);

export const MoneyTransactionHistoryByPlayer = ({
  player,
}: {
  player: Player;
}) => {
  const {
    data: transactions,
    isLoading,
    isError,
  } = trpc.transactions.listTransactionsByEntityId.useQuery({
    entityId: player.entityId || "",
  });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error.</div>;
  }
  if (!transactions) {
    return <div>No transactions found</div>;
  }

  return (
    <div className="container mx-auto p-4 overflow-y-auto">
      <TransactionHistory transactions={transactions} />
    </div>
  );
};

export const MoneyTransactionByEntityType = ({
    entityType,
    gameId
}: {
    entityType: EntityType;
    gameId: string;
}) => {
    const {
        data: transactions,
        isLoading,
        isError,
    } = trpc.transactions.listTransactionsByEntityType.useQuery({
        entityType,
        gameId
    });
    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (isError) {
        return <div>Error.</div>;
    }
    if (!transactions) {
        return <div>No transactions found</div>;
    }

    return (
        <div className="container mx-auto p-4 overflow-y-auto">
            <TransactionHistory transactions={transactions} />
        </div>
    );
}