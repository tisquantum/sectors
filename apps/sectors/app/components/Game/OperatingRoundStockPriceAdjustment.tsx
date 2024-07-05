import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";

const OperatingRoundStockPriceAdjustment = () => {
  const { gameId } = useGame();
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

  return (
    <div>
      <h1>Operating Round Stock Price Adjustment</h1>
    </div>
  );
};

export default OperatingRoundStockPriceAdjustment;
