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
import { CompanyStatus } from "@server/prisma/prisma.client";

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
  const { data: productionResults, isLoading: loadingProductionResults } =
    trpc.productionResult.listProductionResults.useQuery({
      where: {
        operatingRoundId: {
          in: gameState?.OperatingRound.map((round) => round.id) || [],
        },
      },
    });

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

  const medianProductionResult = useMemo(() => {
    if (!productionResults || productionResults.length === 0) return "N/A";
    const sorted = [...productionResults].sort((a, b) => a.revenue - b.revenue);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[middle - 1].revenue + sorted[middle].revenue) / 2
      : sorted[middle].revenue;
  }, [productionResults]);

  const highestProductionResult = useMemo(() => {
    return productionResults?.reduce(
      (highest, result) =>
        result.revenue > highest.revenue ? result : highest,
      productionResults[0]
    );
  }, [productionResults]);

  const lowestProductionResult = useMemo(() => {
    return productionResults?.reduce(
      (lowest, result) => (result.revenue < lowest.revenue ? result : lowest),
      productionResults[0]
    );
  }, [productionResults]);

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
          <h2 className="text-lg font-bold">Median Production Result</h2>
          <p>${medianProductionResult}</p>
        </div>
        <div className="p-4 bg-zinc-800 rounded shadow">
          <h2 className="text-lg font-bold">Highest Production Result</h2>
          <p>
            {highestProductionResult?.Company.name || "N/A"} - $
            {highestProductionResult?.revenue.toLocaleString() || "N/A"}
          </p>
        </div>
        <div className="p-4 bg-zinc-800 rounded shadow">
          <h2 className="text-lg font-bold">Lowest Production Result</h2>
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
