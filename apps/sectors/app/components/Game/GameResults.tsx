import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
} from "@nextui-org/react";
import { useGame } from "./GameContext";
import { trpc } from "@sectors/app/trpc";
import { RiStarFill } from "@remixicon/react";
import { useMemo } from "react";
import PlayerAvatar from "../Player/PlayerAvatar";
import {
  CompanyStatus,
  OperationMechanicsVersion,
} from "@server/prisma/prisma.client";

const PlayerResultsOverview = () => {
  const { gameState } = useGame();
  const {
    data: playerResults,
    isLoading,
    isError,
  } = trpc.playerResult.listPlayerResults.useQuery({
    where: {
      gameRecordId: gameState.GameRecord?.id,
    },
    orderBy: {
      placement: "asc",
    },
  });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error player results.</div>;
  }
  if (!playerResults) {
    return <div>No player results found.</div>;
  }
  return (
    <div className="container mx-auto px-4">
      <Table className="min-w-full">
        <TableHeader>
          <TableColumn>#</TableColumn>
          <TableColumn>Player</TableColumn>
          <TableColumn>Net Worth</TableColumn>
          <TableColumn>Ranking Points</TableColumn>
          <TableColumn>Total Shares</TableColumn>
          <TableColumn>Cash On Hand</TableColumn>
        </TableHeader>
        <TableBody>
          {playerResults.map((result) => (
            <TableRow key={result.id}>
              <TableCell>
                <div className="flex items-center text-center justify-center gap-2">
                  <span>{result.placement}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <PlayerAvatar player={result.player} />
                  <span>{result.player?.nickname || "Unknown"}</span>
                </div>
              </TableCell>
              <TableCell>${result.netWorth.toLocaleString()}</TableCell>
              <TableCell>{result.rankingPoints}</TableCell>
              <TableCell>{result.player.Share.length}</TableCell>
              <TableCell>${result.player.cashOnHand}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const GameResultsOverview = () => {
  const { gameState } = useGame();
  const isModernOps =
    gameState?.operationMechanicsVersion === OperationMechanicsVersion.MODERN;

  const { data: productionResults, isLoading: loadingLegacyProduction } =
    trpc.productionResult.listProductionResults.useQuery(
      {
        where: {
          operatingRoundId: {
            in: gameState?.OperatingRound.map((round) => round.id) || [],
          },
        },
      },
      { enabled: !!gameState?.id && !isModernOps }
    );

  const { data: factoryProductions, isLoading: loadingFactoryProduction } =
    trpc.factoryProduction.listForGame.useQuery(
      { gameId: gameState?.id ?? "" },
      { enabled: !!gameState?.id && isModernOps }
    );

  const loadingProductionResults =
    isModernOps ? loadingFactoryProduction : loadingLegacyProduction;

  const totalCompaniesOpened = gameState?.Company.length || 0;
  const remainingBankTotal = gameState?.bankPoolNumber || 0;

  const highestStockPriceCompany = useMemo(() => {
    return gameState?.Company.reduce((highest, company) =>
      (company.currentStockPrice || 0) > (highest.currentStockPrice || 0)
        ? company
        : highest
    );
  }, [gameState?.Company]);

  const lowestStockPriceCompany = useMemo(() => {
    return gameState?.Company.reduce((lowest, company) =>
      (company.currentStockPrice || 0) < (lowest.currentStockPrice || 0)
        ? company
        : lowest
    );
  }, [gameState?.Company]);

  /** Legacy: one ProductionResult per company per operating round. Modern: sum factory revenue per company per turn. */
  const {
    medianProductionResult,
    highestProductionResult,
    lowestProductionResult,
  } = useMemo(() => {
    if (isModernOps) {
      if (!factoryProductions?.length) {
        return {
          medianProductionResult: "N/A" as const,
          highestProductionResult: null as null,
          lowestProductionResult: null as null,
        };
      }
      const byCompanyTurn = new Map<
        string,
        { revenue: number; name: string }
      >();
      for (const row of factoryProductions) {
        const key = `${row.companyId}:${row.gameTurnId}`;
        const prev = byCompanyTurn.get(key);
        const name = row.Company?.name ?? "Unknown";
        byCompanyTurn.set(key, {
          revenue: (prev?.revenue ?? 0) + row.revenue,
          name: prev?.name ?? name,
        });
      }
      const rows = [...byCompanyTurn.values()];
      const sorted = [...rows].sort((a, b) => a.revenue - b.revenue);
      const middle = Math.floor(sorted.length / 2);
      const median =
        sorted.length === 0
          ? ("N/A" as const)
          : sorted.length % 2 === 0
            ? (sorted[middle - 1].revenue + sorted[middle].revenue) / 2
            : sorted[middle].revenue;
      const highest = rows.reduce((a, b) => (a.revenue >= b.revenue ? a : b));
      const lowest = rows.reduce((a, b) => (a.revenue <= b.revenue ? a : b));
      return {
        medianProductionResult: median,
        highestProductionResult: {
          Company: { name: highest.name },
          revenue: highest.revenue,
        },
        lowestProductionResult: {
          Company: { name: lowest.name },
          revenue: lowest.revenue,
        },
      };
    }

    if (!productionResults?.length) {
      return {
        medianProductionResult: "N/A" as const,
        highestProductionResult: null as null,
        lowestProductionResult: null as null,
      };
    }
    const sorted = [...productionResults].sort((a, b) => a.revenue - b.revenue);
    const middle = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 0
        ? (sorted[middle - 1].revenue + sorted[middle].revenue) / 2
        : sorted[middle].revenue;
    const highest = productionResults.reduce((h, r) =>
      r.revenue > h.revenue ? r : h
    );
    const lowest = productionResults.reduce((l, r) =>
      r.revenue < l.revenue ? r : l
    );
    return {
      medianProductionResult: median,
      highestProductionResult: highest,
      lowestProductionResult: lowest,
    };
  }, [isModernOps, factoryProductions, productionResults]);

  const totalCompaniesFloated = gameState?.Company.filter(
    (company) => company.isFloated
  ).length;
  const totalCompaniesBankrupted = gameState?.Company.filter(
    (company) => company.status == CompanyStatus.BANKRUPT
  ).length;
  //TODO: Most voted action, Most popular company (one with most transactions)
  if (loadingProductionResults) {
    return <div>Loading production results...</div>;
  }

  return (
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-zinc-800 rounded shadow">
          <h2 className="text-lg font-bold">Total Companies Opened</h2>
          <p>{totalCompaniesOpened}</p>
        </div>
        <div className="p-4 bg-zinc-800 rounded shadow">
          <h2 className="text-lg font-bold">Total Companies Floated</h2>
          <p>{totalCompaniesFloated}</p>
        </div>
        <div className="p-4 bg-zinc-800 rounded shadow">
          <h2 className="text-lg font-bold">Total Companies Bankrupted</h2>
          <p>{totalCompaniesBankrupted}</p>
        </div>
        <div className="p-4 bg-zinc-800 rounded shadow">
          <h2 className="text-lg font-bold">Remaining Bank Total</h2>
          <p>${remainingBankTotal}</p>
        </div>
        <div className="p-4 bg-zinc-800 rounded shadow">
          <h2 className="text-lg font-bold">Highest Stock Price Company</h2>
          <p>
            {highestStockPriceCompany?.name || "N/A"} - $
            {highestStockPriceCompany?.currentStockPrice || "N/A"}
          </p>
        </div>
        <div className="p-4 bg-zinc-800 rounded shadow">
          <h2 className="text-lg font-bold">Lowest Stock Price Company</h2>
          <p>
            {lowestStockPriceCompany?.name || "N/A"} - $
            {lowestStockPriceCompany?.currentStockPrice || "N/A"}
          </p>
        </div>
        <div className="p-4 bg-zinc-800 rounded shadow">
          <h2 className="text-lg font-bold">
            {isModernOps
              ? "Median company revenue (factories / turn)"
              : "Median Production Result"}
          </h2>
          <p>
            {medianProductionResult === "N/A"
              ? "N/A"
              : `$${medianProductionResult.toLocaleString()}`}
          </p>
        </div>
        <div className="p-4 bg-zinc-800 rounded shadow">
          <h2 className="text-lg font-bold">
            {isModernOps
              ? "Highest company revenue (factories / turn)"
              : "Highest Production Result"}
          </h2>
          <p>
            {highestProductionResult?.Company.name || "N/A"} - $
            {highestProductionResult?.revenue.toLocaleString() || "N/A"}
          </p>
        </div>
        <div className="p-4 bg-zinc-800 rounded shadow">
          <h2 className="text-lg font-bold">
            {isModernOps
              ? "Lowest company revenue (factories / turn)"
              : "Lowest Production Result"}
          </h2>
          <p>
            {lowestProductionResult?.Company.name || "N/A"} - $
            {lowestProductionResult?.revenue.toLocaleString() || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};
const GameResults = ({
  isOpen,
  onOpen,
  onClose,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onOpenChange: (isOpen: boolean) => void;
}) => {
  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="full"
        className="h-5/6 dark bg-slate-900 text-foreground"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="container mx-auto px-4">
                  <h1 className="text-xl lg:text-3xl font-bold">
                    Game Results
                  </h1>
                </div>
              </ModalHeader>
              <ModalBody className="overflow-y-scroll scrollbar">
                <GameResultsOverview />
                <PlayerResultsOverview />
              </ModalBody>
              <ModalFooter>
                <Button
                  color="primary"
                  className="text-lg lg:text-2xl"
                  variant="light"
                  onPress={onClose}
                >
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default GameResults;
