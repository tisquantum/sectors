import { RiExchangeBoxFill } from "@remixicon/react";
import { trpc } from "@sectors/app/trpc";
import {
  Company,
  EntityType,
  Player,
  Transaction,
  TransactionType,
} from "@server/prisma/prisma.client";
import PlayerAvatar from "../Player/PlayerAvatar";
import { TransactionWithEntities } from "@server/prisma/prisma.types";
import { useState } from "react";

const TransactionHistory = ({
  transactions,
}: {
  transactions: TransactionWithEntities[];
}) => {
  const [sortBy, setSortBy] = useState<"timestamp" | "value">("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSortChange = (sortKey: "timestamp" | "value") => {
    if (sortBy === sortKey) {
      setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(sortKey);
      setSortOrder("asc");
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    if (sortBy === "timestamp") {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortOrder === "asc"
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    } else {
      return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
    }
  });

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          className={`mr-2 ${sortBy === "timestamp" ? "font-bold" : ""}`}
          onClick={() => handleSortChange("timestamp")}
        >
          Sort by Date {sortOrder === "asc" ? "↑" : "↓"}
        </button>
        <button
          className={sortBy === "value" ? "font-bold" : ""}
          onClick={() => handleSortChange("value")}
        >
          Sort by Value {sortOrder === "asc" ? "↑" : "↓"}
        </button>
      </div>
      {sortedTransactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex flex-col items-center justify-between p-4 mb-2 shadow rounded-lg"
        >
          <div className="flex justify-center items-center">
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

          {transaction.description && (
            <div className="text-gray-600 italic mt-2 text-sm">
              Note: {transaction.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

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
    transactionType: TransactionType.CASH,
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
    <div className="container mx-auto p-4 flex flex-col h-full overflow-y-auto scrollbar">
      <TransactionHistory transactions={transactions} />
    </div>
  );
};

export const MoneyTransactionHistoryByCompany = ({
  company,
}: {
  company: Company;
}) => {
  const {
    data: transactions,
    isLoading,
    isError,
  } = trpc.transactions.listTransactionsByEntityId.useQuery({
    entityId: company.entityId || "",
    transactionType: TransactionType.CASH,
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
    <div className="container mx-auto p-4 flex flex-col h-full overflow-y-auto scrollbar">
      <TransactionHistory transactions={transactions} />
    </div>
  );
};

export const MoneyTransactionByEntityType = ({
  entityType,
  gameId,
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
    gameId,
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
    <div className="container mx-auto p-4 flex flex-col h-full overflow-y-auto scrollbar">
      <TransactionHistory transactions={transactions} />
    </div>
  );
};
