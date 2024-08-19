import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import {
  ContractState,
  DistributionStrategy,
  OrderStatus,
  OrderType,
  ShareLocation,
} from "@server/prisma/prisma.client";
import { useEffect, useState } from "react";
import {
  AvatarGroup,
  Input,
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
  RiCurrencyFill,
  RiFundsFill,
  RiPriceTag2Fill,
  RiStrikethrough,
} from "@remixicon/react";
import DebounceButton from "../General/DebounceButton";
import { OptionContractWithRelations } from "@server/prisma/prisma.types";

const DerivativesTable = ({ isInteractive }: { isInteractive: boolean }) => {
  const { gameId, gameState, currentPhase, authPlayer } = useGame();
  const useCreatePlayerOrderMutation =
    trpc.playerOrder.createPlayerOrder.useMutation();
  const useExerciseContract =
    trpc.optionContract.exerciseOptionContract.useMutation();
  const {
    data: optionsContracts,
    isLoading,
    refetch: refetchOptionsContracts,
  } = trpc.optionContract.listOptionContracts.useQuery({
    where: {
      gameId,
      contractState: {
        not: ContractState.DISCARDED,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
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
    refetchOptionsContracts();
  }, [currentPhase?.name]);
  const [bidAmounts, setBidAmounts] = useState<{ [key: string]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  if (isLoading) return <div>Loading...</div>;
  if (!optionsContracts) return <div>No options contracts found</div>;

  let columns = [
    "Option State",
    "Place Order",
    "Orders",
    "Owner",
    "Company Name",
    "Stock Symbol",
    "Stock Price",
    "Shares",
    "Strike Price",
    "Premium",
    "Term",
    "Current Term",
    "Step Bonus",
  ];
  //if not isInteractive, remove Place Order
  columns = columns.filter((column) => {
    if (!isInteractive && column === "Place Order") return false;
    return true;
  });

  const renderTableCellContent = (
    contract: OptionContractWithRelations,
    column: string
  ) => {
    switch (column) {
      case "Option State":
        return contract.contractState;
      case "Orders":
        return (
          <AvatarGroup>
            {playerOrders
              ?.filter(
                (playerOrder) => playerOrder.optionContractId === contract.id
              )
              ?.map((playerOrder) => (
                <PlayerAvatar player={playerOrder.Player} />
              ))}
          </AvatarGroup>
        );
      case "Owner":
        console.log("contract PlayerOrders", contract);
        const owner = contract.PlayerOrders?.find(
          (playerOrder) =>
            playerOrder.orderStatus === OrderStatus.OPEN ||
            playerOrder.orderStatus === OrderStatus.FILLED ||
            playerOrder.orderStatus === OrderStatus.REJECTED
        );
        const ownerPlayer = gameState.Player.find(
          (player) => player.id === owner?.playerId
        );
        return ownerPlayer ? (
          <PlayerAvatar player={ownerPlayer} />
        ) : (
          <span>n/a</span>
        );
      case "Company Name":
        return contract.Company.name;
      case "Stock Symbol":
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
      case "Place Order":
        return (
          <>
            {isInteractive &&
              contract.contractState == ContractState.FOR_SALE &&
              (!isSubmitted ? (
                <div
                  className="flex flex items-center justify-center content-center
                 gap-1"
                >
                  {gameState.distributionStrategy ==
                    DistributionStrategy.BID_PRIORITY && (
                    <Input
                      className="w-24"
                      type="number"
                      placeholder="Enter bid amount"
                      label="Bid"
                      min={contract.premium}
                      max={authPlayer.cashOnHand}
                      defaultValue={contract.premium.toString()}
                      value={
                        bidAmounts[contract.id]?.toString() ||
                        contract.premium?.toString()
                      }
                      onChange={(e) => {
                        setBidAmounts({
                          ...bidAmounts,
                          [contract.id]: e.target.value,
                        });
                      }}
                    />
                  )}
                  <DebounceButton
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                    onClick={() => {
                      console.log(
                        "parseInt(bidAmounts[contract.id])",
                        parseInt(bidAmounts[contract.id])
                      );
                      try {
                        useCreatePlayerOrderMutation.mutate({
                          companyId: contract.companyId,
                          orderType: OrderType.OPTION,
                          quantity: contract.shareCount,
                          value:
                            parseInt(bidAmounts[contract.id]) ||
                            contract.premium,
                          playerId: authPlayer.id,
                          location: ShareLocation.DERIVATIVE_MARKET,
                          contractId: contract.id,
                        });
                      } catch (e) {
                        console.error("player order mutation error", e);
                      }
                      setIsSubmitted(true);
                    }}
                  >
                    Call
                  </DebounceButton>
                </div>
              ) : (
                <div className="flex flex-col gap-2">Submitted</div>
              ))}
          </>
        );
      case "Shares":
        return (
          <span className="flex gap-1">
            <RiCurrencyFill />
            {contract.shareCount}
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
