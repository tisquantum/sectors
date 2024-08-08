import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
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
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="py-2 px-4 border">#</th>
            <th className="py-2 px-4 border">Player</th>
            <th className="py-2 px-4 border">Net Worth</th>
            <th className="py-2 px-4 border">Ranking Points</th>
            <th className="py-2 px-4 border">Total Shares</th>
            <th className="py-2 px-4 border">Cash On Hand</th>
          </tr>
        </thead>
        <tbody>
          {playerResults.map((result) => (
            <tr key={result.id}>
              <td className="py-2 px-4 border">
                <div className="flex items-center text-center justify-center gap-2">
                  <span>{result.placement}</span>
                </div>
              </td>
              <td className="py-2 px-4 border">
                <div className="flex items-center gap-2">
                  <PlayerAvatar player={result.player} />
                  <span>{result.player?.nickname || "Unknown"}</span>
                </div>
              </td>
              <td className="py-2 px-4 border">
                ${result.netWorth.toLocaleString()}
              </td>
              <td className="py-2 px-4 border">{result.rankingPoints}</td>
              <td className="py-2 px-4 border">{result.player.Share.length}</td>
              <td className="py-2 px-4 border">${result.player.cashOnHand}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
    console.log("gameState", gameState);
    return gameState?.Company.reduce((highest, company) =>
      company.currentStockPrice > highest.currentStockPrice ? company : highest
    );
  }, [gameState?.Company]);

  const lowestStockPriceCompany = useMemo(() => {
    return gameState?.Company.reduce((lowest, company) =>
      company.currentStockPrice < lowest.currentStockPrice ? company : lowest
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
        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-bold">Total Companies Opened</h2>
          <p>{totalCompaniesOpened}</p>
        </div>
        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-bold">Total Companies Floated</h2>
          <p>{totalCompaniesFloated}</p>
        </div>
        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-bold">Total Companies Bankrupted</h2>
          <p>{totalCompaniesBankrupted}</p>
        </div>
        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-bold">Remaining Bank Total</h2>
          <p>{remainingBankTotal}</p>
        </div>
        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-bold">Highest Stock Price Company</h2>
          <p>
            {highestStockPriceCompany?.name || "N/A"} - $
            {highestStockPriceCompany?.currentStockPrice || "N/A"}
          </p>
        </div>
        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-bold">Lowest Stock Price Company</h2>
          <p>
            {lowestStockPriceCompany?.name || "N/A"} - $
            {lowestStockPriceCompany?.currentStockPrice || "N/A"}
          </p>
        </div>
        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-bold">Median Production Result</h2>
          <p>${medianProductionResult}</p>
        </div>
        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-bold">Highest Production Result</h2>
          <p>
            {highestProductionResult?.Company.name || "N/A"} - $
            {highestProductionResult?.revenue.toLocaleString() || "N/A"}
          </p>
        </div>
        <div className="p-4 border rounded shadow">
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
        className="h-5/6"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="container mx-auto px-4">
                  <h1 className="text-3xl font-bold">Game Results</h1>
                </div>
              </ModalHeader>
              <ModalBody className="overflow-y-scroll scrollbar">
                <GameResultsOverview />
                <PlayerResultsOverview />
              </ModalBody>
              <ModalFooter>
                <Button
                  color="primary"
                  className="text-2xl"
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
