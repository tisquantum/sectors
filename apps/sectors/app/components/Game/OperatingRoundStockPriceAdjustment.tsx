import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { StockHistoryWithPhase } from "@server/prisma/prisma.types";
import CompanyInfo from "../Company/CompanyInfo";

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
    //sort stock history descending
    stockHistory.sort((a, b) => b.id - a.id);

    const relevantStockPrices = //get the first 3 stock prices
      stockHistory.length > 3 ? stockHistory.slice(0, 3) : stockHistory;

    return relevantStockPrices.map((history) => (
      <div
        className="flex flex-col bg-gray-900 p-3 rounded-md mb-2"
        key={history.id}
      >
        <span className="text-sm font-semibold">
          Phase: {history.Phase.name}
        </span>
        <span>Price: ${history.price}</span>
      </div>
    ));
  };

  return (
    <div className="p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">
        Operating Round Stock Price Adjustment
      </h1>
      <p>
        <ul>
          <li>Adjusting Stock Price</li>
          <li>Decrement any Sector Demand Bonuses</li>
          <li>Decrement any Company Temporary Supply Bonuses</li>
          <li>Decrement any Active/Insolvent Company Demand</li>
        </ul>
      </p>
      <div className="flex flex-wrap gap-3">
        {companies.map((company) => (
          <div
            className="flex flex-col p-4 bg-slate-800 rounded-lg shadow-md"
            key={company.id}
          >
            <CompanyInfo companyId={company.id} showBarChart isMinimal />
            <div className="mt-4">
              <span className="block text-lg font-semibold mb-2">
                Current Stock Price: ${company.currentStockPrice}
              </span>
              <div>
                <h3 className="text-md font-semibold mb-2">
                  Recent Price Changes
                </h3>
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
