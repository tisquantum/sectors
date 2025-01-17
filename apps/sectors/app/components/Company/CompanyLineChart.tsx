import { trpc } from "@sectors/app/trpc";
import { sectorColors } from "@server/data/gameData";
import { useGame } from "../Game/GameContext";
import { LineChart } from "@tremor/react";

const valueFormatter = function (number: number) {
  return "$ " + new Intl.NumberFormat("us").format(number).toString();
};

export const CompanyLineChart = ({ companyId }: { companyId: string }) => {
  const {
    data: company,
    isLoading,
    isError,
    refetch,
  } = trpc.company.getCompanyWithRelations.useQuery({
    id: companyId,
  });
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;
  if (!company) return <div>Company not found</div>;
  const chartData = company.StockHistory.sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  )
    .filter((stockHistory) => stockHistory.price !== 0)
    .map((stockHistory, index) => ({
      phaseId: `${index + 1} ${stockHistory.Phase.name}`,
      stockPrice: stockHistory.price,
      stockAction: stockHistory.action,
      steps: stockHistory.stepsMoved,
    }));
  return (
    <div className="flex flex-col justify-center items-center h-[400px] w-[330px] lg:w-[500px]">
      {company.name}
      <LineChart
        data={chartData}
        index="phaseId"
        categories={["stockPrice"]}
        yAxisLabel="Stock Price"
        xAxisLabel="Stock Price Updated"
        colors={[sectorColors[company.Sector.name]]}
        valueFormatter={valueFormatter}
      />
    </div>
  );
};
