import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { StockHistory } from "@server/prisma/prisma.client";
import { StockHistoryWithPhase } from "@server/prisma/prisma.types";

const OperatingRoundStockPriceAdjustment = () => {
  const { gameId, currentPhase } = useGame();
  const {
    data: companies,
    isLoading,
    error,
  } = trpc.company.listCompaniesWithSectorAndStockHistory.useQuery({
    where: { gameId },
  });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  if (!companies) {
    return <div>No companies found</div>;
  }
  const displayLastStockPrices = (stockHistory: StockHistoryWithPhase[]) => {
    //filter stock prices
    const relevantStockPrices = stockHistory.filter((stockHistory) => {
      return (
        stockHistory.Phase.operatingRoundId === currentPhase?.operatingRoundId
      );
    });
    //sort stock prices
    relevantStockPrices.sort((a, b) => {
      return a.Phase.createdAt > b.Phase.createdAt ? -1 : 1;
    });
    return relevantStockPrices.map((stockHistory) => (
      <div className="flex flex-col bg-slate-800 p-4" key={stockHistory.id}>
        <h2>Phase: {stockHistory.Phase.name}</h2>
        <span>Price: {stockHistory.price}</span>
      </div>
    ));
  };
  return (
    <div>
      <h1>Operating Round Stock Price Adjustment</h1>
      <div className="grid grid-cols-3 gap-3">
        {companies.map((company) => (
          <div className="flex flex-col p-4 bg-slate-800" key={company.id}>
            <h2>{company.name}</h2>
            <div className="flex gap-3 flex-col">
              <span>Current Stock Price: {company.currentStockPrice}</span>
              <div className="grid grid-cols-3 gap-4">
                <h3>Price Changes During Production</h3>
                {displayLastStockPrices(company.StockHistory)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OperatingRoundStockPriceAdjustment;
