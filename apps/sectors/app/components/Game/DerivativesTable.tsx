import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import {
  ContractState,
  OrderStatus,
  OrderType,
} from "@server/prisma/prisma.client";
import { useEffect } from "react";
import {
  AvatarGroup,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import PlayerAvatar from "../Player/PlayerAvatar";
import {
  RiArrowUpCircleFill,
  RiCalendar2Fill,
  RiCalendarScheduleFill,
  RiFundsFill,
  RiPriceTag2Fill,
  RiStrikethrough,
} from "@remixicon/react";

const DerivativesTable = () => {
  const { gameId, currentPhase } = useGame();
  const { data: optionsContracts, isLoading } =
    trpc.optionContract.listOptionContracts.useQuery({
      where: { gameId, contractState: ContractState.FOR_SALE },
    });
  const {
    data: playerOrders,
    isLoading: playerOrdersLoading,
    refetch,
  } = trpc.playerOrder.listPlayerOrdersConcealed.useQuery({
    where: {
      gameId,
      orderStatus: OrderStatus.PENDING,
      stockRoundId: currentPhase?.stockRoundId,
      orderType: OrderType.OPTION,
    },
  });

  useEffect(() => {
    refetch();
  }, [currentPhase?.name]);

  if (isLoading) return <div>Loading...</div>;
  if (!optionsContracts) return <div>No options contracts found</div>;

  const columns = [
    "Option State",
    "Orders",
    "Company Name",
    "Company Stock Symbol",
    "Stock Price",
    "Strike Price",
    "Premium",
    "Term",
    "Current Term",
    "Step Bonus",
  ];

  const renderTableCellContent = (contract: any, column: string) => {
    switch (column) {
      case "Option State":
        return contract.contractState;
      case "Orders":
        return (
          <AvatarGroup>
            {playerOrders?.map((playerOrder) => (
              <PlayerAvatar player={playerOrder.Player} />
            ))}
          </AvatarGroup>
        );
      case "Company Name":
        return contract.Company.name;
      case "Company Stock Symbol":
        return contract.Company.stockSymbol;
      case "Stock Price":
        return (
          <span className="flex items-center gap-1">
            <RiFundsFill size={20} />${contract.Company.currentStockPrice}
          </span>
        );
      case "Strike Price":
        return (
          <span className="flex items-center gap-1">
            <RiStrikethrough />${contract.strikePrice}
          </span>
        );
      case "Premium":
        return (
          <span className="flex items-center gap-1">
            <RiPriceTag2Fill />${contract.premium}
          </span>
        );
      case "Term":
        return (
          <span className="flex items-center gap-1">
            <RiCalendarScheduleFill />
            {contract.term}
          </span>
        );
      case "Current Term":
        return (
          <span className="flex items-center gap-1">
            <RiCalendar2Fill />
            {contract.currentTerm}
          </span>
        );
      case "Step Bonus":
        return (
          <span className="flex items-center gap-1">
            <RiArrowUpCircleFill />
            {contract.stepBonus}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Table aria-label="Derivatives Table">
      <TableHeader>
        {columns.map((column) => (
          <TableColumn key={column}>{column}</TableColumn>
        ))}
      </TableHeader>
      <TableBody>
        {optionsContracts.map((contract) => (
          <TableRow key={contract.id}>
            {columns.map((column) => (
              <TableCell key={column}>
                {renderTableCellContent(contract, column)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default DerivativesTable;
