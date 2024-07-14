"use client";

import { CurrencyDollarIcon } from "@heroicons/react/24/solid";
import {
  Card,
  CardBody,
  Input,
  Radio,
  RadioGroup,
  Slider,
  Tab,
  Tabs,
} from "@nextui-org/react";
import { trpc } from "@sectors/app/trpc";
import {
  Company,
  DistributionStrategy,
  OrderType,
  PlayerOrder,
  Prisma,
  ShareLocation,
} from "@server/prisma/prisma.client";
import React, {
  ChangeEvent,
  ChangeEventHandler,
  useEffect,
  useState,
} from "react";
import { useGame } from "../Game/GameContext";
import {
  BORROW_RATE,
  MAX_LIMIT_ORDER,
  MAX_MARKET_ORDER,
  MAX_SHORT_ORDER,
} from "@server/data/constants";
import { PlayerOrderWithCompany } from "@server/prisma/prisma.types";
import { getPseudoSpend } from "@server/data/helpers";
import Button from "@sectors/app/components/General/DebounceButton";

const RiskAssessment = () => {
  return (
    <div>
      <div>Loan Interest Rate {BORROW_RATE}%</div>
    </div>
  );
};

const ShortOrderInput: React.FC<{
  company: Company;
  onShareChange: (value: number) => void;
}> = ({ company, onShareChange }) => {
  const [maxStockValue, setMaxStockValue] = useState<number>(3);
  const [minStockValue, setMinStockValue] = useState<number>(1);
  const [shareValue, setShareValue] = useState<number>(1);
  const [minimumMarginAccount, setMinimumMarginAccount] = useState<number>(0);

  useEffect(() => {
    setShareValue(minStockValue);
  }, [minStockValue]);

  useEffect(() => {
    setMinimumMarginAccount((company.currentStockPrice || 0) * shareValue);
  }, [shareValue]);

  const handleShareChange = (value: number | number[]) => {
    //if array, use zero
    if (Array.isArray(value)) {
      value = value[0];
    }
    setShareValue(value);
  };

  return (
    <>
      <RiskAssessment />
      <div className="flex gap-2">
        <span>Minimum Margin Account</span>
        <span>${minimumMarginAccount}</span>
      </div>
      <div>
        <span>All collected dividends must be paid back to lender</span>
      </div>
      <Slider
        size="md"
        step={1}
        color="foreground"
        label="Shares"
        showSteps={true}
        maxValue={maxStockValue}
        minValue={minStockValue}
        defaultValue={minStockValue}
        value={shareValue}
        onChange={handleShareChange}
        className="max-w-md"
        marks={[
          { value: minStockValue, label: `${minStockValue}` },
          { value: maxStockValue, label: `${maxStockValue}` },
        ]}
      />
    </>
  );
};
const OrderCounter: React.FC<{
  ordersRemaining: number;
  maxOrders: number;
}> = ({ ordersRemaining, maxOrders }) => {
  return (
    <div className="flex noWrap gap-1">
      {Array.from({ length: maxOrders }, (_, i) => (
        // Render an empty bordered circle for each order over orders remaining, otherwise render circle with icon inside
        <div
          key={i}
          className={`flex items-center justify-center w-8 h-8 rounded-full border border-default-400 ${
            i < ordersRemaining ? "bg-green-400" : ""
          }`}
        />
      ))}
    </div>
  );
};

const LimitOrderInput = ({
  handleLimitOrder,
  handleSelectionIsBuy,
  isBuy,
}: {
  handleLimitOrder: (limitOrderValue: number) => void;
  handleSelectionIsBuy: (selection: boolean) => void;
  isBuy?: boolean;
}) => {
  const { authPlayer } = useGame();
  const { data: shares, isLoading } = trpc.share.listShares.useQuery({
    where: { playerId: authPlayer.id },
  });
  const [limitOrderValue, setLimitOrderValue] = useState<number>(0);
  useEffect(() => {
    handleLimitOrder(limitOrderValue);
  }, [limitOrderValue]);
  return (
    <>
      <BuyOrSell handleSelectionIsBuy={handleSelectionIsBuy} />
      {!!!isBuy && (
        <div>
          <span>Shares Owned x {shares?.length}</span>
        </div>
      )}
      <Input
        id="loAmount"
        type="number"
        label="Limit Order Amount"
        placeholder="0.00"
        labelPlacement="inside"
        onValueChange={(value: string) => setLimitOrderValue(Number(value))}
        startContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">$</span>
          </div>
        }
      />
    </>
  );
};
interface BuyOrSellProps {
  alsoCancel?: boolean;
  handleSelectionIsBuy?: (selection: boolean) => void;
  isIpo?: boolean;
}

const BuyOrSell: React.FC<BuyOrSellProps> = ({
  alsoCancel,
  handleSelectionIsBuy,
  isIpo,
}) => {
  const handleSelection = (event: ChangeEvent<HTMLInputElement>) => {
    if (handleSelectionIsBuy) {
      handleSelectionIsBuy(event.target.value === "buy");
    }
  };

  return (
    <RadioGroup
      onChange={handleSelection}
      orientation="horizontal"
      defaultValue="buy"
    >
      <Radio defaultChecked value="buy">
        Buy
      </Radio>
      {!isIpo && <Radio value="sell">Sell</Radio>}
      {alsoCancel && <Radio value="cancel">Cancel Order</Radio>}
    </RadioGroup>
  );
};

interface TabContentProps {
  handleSelectionIsBuy: (event: boolean) => void;
  handleShares: (event: number) => void;
  handleValueChange: (event: number) => void;
  ordersRemaining: number;
  isIpo?: boolean;
  maxValue: number;
  minValue: number;
  defaultValue?: number;
}

const TabContentMO: React.FC<TabContentProps> = ({
  handleSelectionIsBuy,
  handleShares,
  handleValueChange,
  ordersRemaining,
  isIpo,
  maxValue,
  minValue,
  defaultValue,
}) => {
  const { gameState } = useGame();
  const [shareValue, setShareValue] = useState<number>(1);
  const [marketOrderBidValue, setMarketOrderBidValue] = useState<number>(
    defaultValue || 0
  );
  useEffect(() => {
    handleShares(minValue);
  }, []);
  return (
    <div className="flex flex-col text-center items-center center-content justify-center gap-2">
      <OrderCounter
        ordersRemaining={ordersRemaining}
        maxOrders={MAX_MARKET_ORDER}
      />
      <BuyOrSell handleSelectionIsBuy={handleSelectionIsBuy} isIpo={isIpo} />
      {gameState.distributionStrategy == DistributionStrategy.BID_PRIORITY && (
        <Input
          id="moAmount"
          type="number"
          label="Market Order Amount"
          placeholder="0.00"
          labelPlacement="inside"
          onValueChange={(value: string) => {
            handleValueChange(Number(value));
            setMarketOrderBidValue(Number(value));
          }}
          value={marketOrderBidValue.toString()}
          startContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-small">$</span>
            </div>
          }
        />
      )}
      {minValue === maxValue ? (
        <div>{minValue} Share Remaining</div>
      ) : (
        <Slider
          size="md"
          step={1}
          color="foreground"
          label="Shares"
          showSteps={true}
          maxValue={maxValue}
          minValue={minValue}
          onChange={(value) => {
            console.log("slider value mo", value);
            if (Array.isArray(value)) {
              value = value[0];
            }
            handleShares(value);
            setShareValue(value);
          }}
          defaultValue={minValue}
          className="max-w-md"
          value={shareValue}
        />
      )}
    </div>
  );
};

interface TabContentPropsSO {
  company: Company;
  onShareChange: (value: number) => void;
  ordersRemaining: number;
}

const TabContentSO: React.FC<TabContentPropsSO> = ({
  company,
  onShareChange,
  ordersRemaining,
}) => {
  return (
    <div className="flex flex-col text-center items-center center-content justify-center gap-2">
      <OrderCounter
        ordersRemaining={ordersRemaining}
        maxOrders={MAX_SHORT_ORDER}
      />
      <ShortOrderInput company={company} onShareChange={onShareChange} />
    </div>
  );
};

interface TabContentPropsLO {
  handleLimitOrderChange: (limitOrderValue: number) => void;
  handleSelectionIsBuy: (selection: boolean) => void;
  ordersRemaining: number;
  isBuy?: boolean;
}

const TabContentLO: React.FC<TabContentPropsLO> = ({
  handleLimitOrderChange,
  handleSelectionIsBuy,
  ordersRemaining,
  isBuy,
}) => {
  return (
    <div className="flex flex-col text-center items-center center-content justify-center gap-2">
      <OrderCounter
        ordersRemaining={ordersRemaining}
        maxOrders={MAX_LIMIT_ORDER}
      />
      <LimitOrderInput
        handleLimitOrder={handleLimitOrderChange}
        handleSelectionIsBuy={handleSelectionIsBuy}
        isBuy={isBuy}
      />
    </div>
  );
};

let tabs = [
  {
    id: "mo",
    label: "MO",
  },
  {
    id: "lo",
    label: "LO",
  },
  {
    id: "so",
    label: "SO",
  },
];

/**
 * We need a way to track spending before orders are placed.
 * Because orders are placed successively before being resolved,
 * we need to track the total spend and make this visible to the user.
 *
 * @param stockRoundId
 * @param currentOrderValue
 * @returns
 */
const PseudoBalance = ({
  stockRoundId,
  currentOrderValue,
  runningOrderValue,
}: {
  stockRoundId: number;
  currentOrderValue?: number;
  runningOrderValue?: number;
}) => {
  const { authPlayer, currentPhase } = useGame();
  const {
    data: playerOrders,
    isLoading,
    refetch,
  } = trpc.playerOrder.listPlayerOrdersWithCompany.useQuery({
    where: { playerId: authPlayer.id, stockRoundId },
  });
  useEffect(() => {
    refetch();
  }, [currentPhase?.name]);
  if (isLoading) return null;

  const pseudoSpend = playerOrders ? getPseudoSpend(playerOrders) : 0;
  const netSpend = pseudoSpend - (runningOrderValue || 0);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <span>Cash On Hand</span>
        <CurrencyDollarIcon className="w-6 h-6 size-3" />
        <span>{authPlayer.cashOnHand}</span>
      </div>
      <div className="flex items-center gap-1">
        <span>Previous Placed Order Cost This Round</span>
        <CurrencyDollarIcon className="w-6 h-6 size-3" />
        <span>{netSpend}</span>
      </div>
      <div className="flex items-center gap-1">
        <span>Current Order Cost</span>
        <CurrencyDollarIcon className="w-6 h-6" />
        <span>{currentOrderValue}</span>
      </div>
      <div className="flex items-center gap-1">
        <span>Remaining Cash</span>
        <CurrencyDollarIcon className="w-6 h-6" />
        <span>
          {authPlayer.cashOnHand - netSpend + (currentOrderValue || 0)}
        </span>
      </div>
    </div>
  );
};

const calculatePseudoOrderValue = ({
  orderType,
  quantity,
  currentStockPrice,
  premium,
  isBuy,
}: {
  orderType: OrderType;
  quantity: number | null;
  currentStockPrice: number | null;
  premium: number | null;
  isBuy?: boolean;
}) => {
  switch (orderType) {
    case OrderType.MARKET:
      return isBuy
        ? -(quantity || 0) * (currentStockPrice || 0)
        : (quantity || 0) * (currentStockPrice || 0);
    case OrderType.LIMIT:
      return 0;
    case OrderType.SHORT:
      return (quantity || 0) * (currentStockPrice || 0);
    case OrderType.OPTION:
      return -(premium || 0);
    default:
      return 0;
  }
};

const calculateRunningOrderValue = (playerOrders: PlayerOrderWithCompany[]) => {
  let runningOrderValue = 0;
  //filter all orders that aren't market orders
  playerOrders
    .filter((order) => order.orderType !== OrderType.MARKET)
    .forEach((order) => {
      runningOrderValue += calculatePseudoOrderValue({
        orderType: order.orderType,
        quantity: order.quantity,
        currentStockPrice: order.Company.currentStockPrice,
        premium: order.value,
      });
    });
  return runningOrderValue;
};

const PlayerOrderInput = ({
  currentOrder,
  handleCancel,
  isIpo,
  handlePlayerInputConfirmed,
}: {
  currentOrder: Company;
  handleCancel: () => void;
  isIpo: boolean;
  handlePlayerInputConfirmed: () => void;
}) => {
  const { gameId, gameState, authPlayer, currentPhase, refetchAuthPlayer } =
    useGame();
  const { data: playerOrders } =
    trpc.playerOrder.listPlayerOrdersWithCompany.useQuery({
      where: {
        stockRoundId: currentPhase?.stockRoundId,
        playerId: authPlayer?.id,
      },
    });
  const { data: company, isLoading: companyLoading } =
    trpc.company.getCompanyWithShares.useQuery({
      id: currentOrder.id,
    });
  const createPlayerOrder = trpc.playerOrder.createPlayerOrder.useMutation();
  const [share, setShare] = useState(1);
  const [orderValue, setOrderValue] = useState(0);
  const [isBuy, setIsBuy] = useState(true);
  const [isSubmit, setIsSubmit] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.MARKET);
  const [maxValue, setMaxValue] = useState(10);
  const [minValue, setMinValue] = useState(1);
  let runningOrderValue = 0;
  if (playerOrders) {
    runningOrderValue = calculateRunningOrderValue(playerOrders);
  }
  useEffect(() => {
    setIsSubmit(false);
  }, [currentPhase?.name]);
  useEffect(() => {
    if (isBuy) {
      if (isIpo) {
        setMaxValue(
          company?.Share.filter((share) => share.location === ShareLocation.IPO)
            .length || 0
        );
        setMinValue(1);
      } else {
        setMaxValue(
          company?.Share.filter(
            (share) => share.location === ShareLocation.OPEN_MARKET
          ).length || 0
        );
        setMinValue(1);
      }
    } else {
      const playerShares = company?.Share.filter(
        (share) => share.location === ShareLocation.PLAYER
      );
      const authPlayerShares = playerShares?.filter(
        (share) => share.playerId === authPlayer.id
      ).length;
      setMaxValue(authPlayerShares || 0);
      setMinValue(1);
    }
  }, [isBuy, isIpo, company?.Share]);

  if (!gameId || !gameState) return null;
  const currentOrderValue = calculatePseudoOrderValue({
    orderType,
    quantity: share,
    currentStockPrice: currentOrder.currentStockPrice,
    premium: 0, // TODO: Fill for option orders
    isBuy,
  });
  const handleConfirm = () => {
    createPlayerOrder.mutate({
      gameId,
      stockRoundId: gameState.currentStockRoundId ?? 0,
      playerId: authPlayer.id,
      companyId: currentOrder.id,
      phaseId: gameState.currentPhaseId ?? "",
      sectorId: currentOrder.sectorId,
      quantity: share,
      value: orderValue ?? company?.currentStockPrice,
      isSell: !!!isBuy,
      orderType,
      location: isIpo ? ShareLocation.IPO : ShareLocation.OPEN_MARKET,
    });
    setIsSubmit(true);
    refetchAuthPlayer();
    handlePlayerInputConfirmed();
  };
  const handleSelectionChange = (key: React.Key) => {
    switch (key) {
      case "mo":
        setOrderType(OrderType.MARKET);
        break;
      case "lo":
        setOrderType(OrderType.LIMIT);
        break;
      case "so":
        setOrderType(OrderType.SHORT);
        break;
    }
  };
  return (
    <div className="flex flex-col justify-center items-center gap-1 min-w-80 max-w-96">
      <PseudoBalance
        stockRoundId={currentPhase?.stockRoundId ?? 0}
        currentOrderValue={currentOrderValue}
        runningOrderValue={runningOrderValue}
      />
      {isSubmit ? (
        <div className="flex justify-center gap-2">
          <span>Order Submitted.</span>
        </div>
      ) : (
        <>
          {currentOrder && <h2>{currentOrder.name}</h2>}
          <span>{isIpo ? "IPO" : "OPEN MARKET"}</span>
          <Tabs
            aria-label="Dynamic tabs"
            items={tabs}
            onSelectionChange={handleSelectionChange}
          >
            <Tab key="mo" title={"MARKET ORDER"} className="w-full">
              <Card>
                <CardBody>
                  <TabContentMO
                    handleSelectionIsBuy={setIsBuy}
                    handleShares={setShare}
                    handleValueChange={setOrderValue}
                    ordersRemaining={authPlayer.marketOrderActions}
                    isIpo={isIpo}
                    maxValue={maxValue}
                    minValue={minValue}
                  />
                </CardBody>
              </Card>
            </Tab>
            {!isIpo && (
              <Tab key="lo" title={"LIMIT ORDER"} className="w-full">
                <Card>
                  <CardBody>
                    <TabContentLO
                      isBuy={isBuy}
                      handleLimitOrderChange={setOrderValue}
                      handleSelectionIsBuy={setIsBuy}
                      ordersRemaining={authPlayer.limitOrderActions}
                    />
                  </CardBody>
                </Card>
              </Tab>
            )}
            {!isIpo && (
              <Tab key="so" title={"SHORT ORDER"} className="w-full">
                <Card>
                  <CardBody>
                    <TabContentSO
                      company={currentOrder}
                      onShareChange={setShare}
                      ordersRemaining={authPlayer.shortOrderActions}
                    />
                  </CardBody>
                </Card>
              </Tab>
            )}
          </Tabs>
          <div className="flex justify-center gap-2">
            <Button onClick={handleConfirm}>Confirm</Button>
            <Button onClick={handleCancel}>Cancel</Button>
          </div>
        </>
      )}
    </div>
  );
};

export default PlayerOrderInput;
