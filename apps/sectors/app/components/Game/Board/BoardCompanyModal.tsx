"use client";

import { useMemo } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@nextui-org/react";
import { LineChart } from "@tremor/react";
import { sectorColors } from "@server/data/gameData";
import { trpc } from "@sectors/app/trpc";
import CompanyInfoV2 from "../../Company/CompanyV2/CompanyInfoV2";
import CompanyInfo from "../../Company/CompanyInfo";
import { OperationMechanicsVersion } from "@server/prisma/prisma.client";
import { useGame } from "../GameContext";

const formatDollars = (value: number) =>
  `$ ${new Intl.NumberFormat("us").format(value)}`;

/**
 * The one place a company is explained in full. Opened by pressing a company
 * anywhere on the board: the sector map, the stock ladder, a share pill.
 */
export function BoardCompanyModal({
  companyId,
  onClose,
}: {
  companyId: string | null;
  onClose: () => void;
}) {
  const { gameState } = useGame();
  const { data: company } = trpc.company.getCompanyWithSector.useQuery(
    { id: companyId ?? "" },
    { enabled: !!companyId }
  );
  const { data: withHistory } =
    trpc.company.listCompaniesWithSectorAndStockHistory.useQuery(
      { where: { id: companyId ?? "" } },
      { enabled: !!companyId }
    );

  const chartData = useMemo(() => {
    const stockHistory = withHistory?.[0]?.StockHistory ?? [];
    return [...stockHistory]
      .filter((point) => point.price !== 0)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((point, index) => ({
        tick: `${index + 1}`,
        stockPrice: point.price,
      }));
  }, [withHistory]);

  const isModern =
    gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN;

  return (
    <Modal
      isOpen={!!companyId}
      onOpenChange={(open) => !open && onClose()}
      size="5xl"
      scrollBehavior="inside"
      className="dark bg-zinc-950 text-foreground"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-0.5">
          <span>{company?.name ?? "Company"}</span>
          {company && (
            <span className="text-xs font-normal text-zinc-400">
              {company.stockSymbol} · {company.Sector.name} · $
              {company.currentStockPrice}
            </span>
          )}
        </ModalHeader>
        <ModalBody className="gap-4 pb-6">
          {companyId &&
            (isModern ? (
              <CompanyInfoV2 companyId={companyId} />
            ) : (
              <CompanyInfo companyId={companyId} showBarChart />
            ))}
          {chartData.length > 1 && company && (
            <div className="h-64">
              <LineChart
                className="h-full"
                data={chartData}
                index="tick"
                categories={["stockPrice"]}
                yAxisLabel="Stock price"
                xAxisLabel="Price changes"
                colors={[sectorColors[company.Sector.name] ?? "#38bdf8"]}
                valueFormatter={formatDollars}
              />
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
