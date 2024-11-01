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
  Share,
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
  MAX_LIMIT_ORDER_ACTIONS,
  MAX_MARKET_ORDER_ACTIONS,
  MAX_SHORT_ORDER_ACTIONS,
  MAX_SHORT_ORDER_QUANTITY,
} from "@server/data/constants";
import { PlayerOrderWithCompany } from "@server/prisma/prisma.types";
import { getPseudoSpend } from "@server/data/helpers";
import Button from "@sectors/app/components/General/DebounceButton";
import { set } from "lodash";
import PlayerShares from "./PlayerShares";
import ShareComponent from "../Company/Share";
import { Drawer } from "vaul";
import { toast } from "sonner";
import DebounceButton from "@sectors/app/components/General/DebounceButton";
import { useDrawer } from "../Drawer.context";

const RiskAssessment = () => {
  return (
    <div>
      <div>Loan Interest Rate {BORROW_RATE}%</div>
    </div>
  );
};

const ShortOrderInput: React.FC<{
  company: Company;
  handleShares: (value: number) => void;
  minValue: number;
  maxValue: number;
}> = ({ company, handleShares, minValue, maxValue }) => {
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
    handleShares(value);
  };

  return (
    <>
      <RiskAssessment />
      <div className="flex gap-2">
        <span>Minimum Margin Account</span>
        <span>${minimumMarginAccount}</span>
      </div>
      <div>
        <span>
          All collected dividends must be paid back to borrower (ie: you must
          pay dividends for these shares from your cash on hand).
        </span>
      </div>
      <Slider
        size="md"
        step={1}
        color="foreground"
        label="Shares"
        showSteps={true}
        maxValue={maxValue}
        minValue={minValue}
        defaultValue={minValue}
        value={shareValue}
        onChange={handleShareChange}
        className="max-w-md"
        marks={[
          { value: minValue, label: `${minValue}` },
          { value: maxValue, label: `${maxValue}` },
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
  handleShares,
  handleValueChange,
  isBuy,
  maxValue,
  minValue,
  defaultValue,
}: {
  handleLimitOrder: (limitOrderValue: number) => void;
  handleSelectionIsBuy: (selection: boolean) => void;
  handleShares: (event: number) => void;
  handleValueChange: (event: number) => void;
  maxValue: number;
  minValue: number;
  defaultValue?: number;
  isBuy?: boolean;
}) => {
  const { authPlayer } = useGame();
  const { data: shares, isLoading } = trpc.share.listShares.useQuery({
    where: { playerId: authPlayer?.id },
  });
  const [limitOrderValue, setLimitOrderValue] = useState<number>(
    defaultValue || 0
  );
  useEffect(() => {
    handleLimitOrder(limitOrderValue);
  }, [limitOrderValue]);
  return (
    <>
      <BuyOrSell handleSelectionIsBuy={handleSelectionIsBuy} />
      <Input
        id="loAmount"
        type="number"
        label="Limit Order Amount"
        placeholder="0.00"
        labelPlacement="inside"
        value={limitOrderValue.toString()}
        onValueChange={(value: string) => {
          setLimitOrderValue(Number(value));
        }}
        startContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">$</span>
          </div>
        }
      />
      {!!!isBuy && (
        <Slider
          size="md"
          step={1}
          color="foreground"
          label="Shares"
          showSteps={true}
          maxValue={maxValue}
          minValue={minValue}
          onChange={(value) => {
            if (Array.isArray(value)) {
              value = value[0];
            }
            handleShares(value);
          }}
          defaultValue={minValue}
          className="max-w-md"
        />
      )}
    </>
  );
};
interface BuyOrSellProps {
  alsoCancel?: boolean;
  handleSelectionIsBuy?: (selection: boolean) => void;
  isIpo?: boolean;
  showBuy?: boolean;
}

const BuyOrSell: React.FC<BuyOrSellProps> = ({
  alsoCancel,
  handleSelectionIsBuy,
  isIpo,
  showBuy = true,
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
      defaultValue={showBuy ? "buy" : "sell"}
    >
      {showBuy && (
        <Radio defaultChecked value="buy">
          Buy
        </Radio>
      )}
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
  isBuy?: boolean;
  sharesInMarket: number;
  minBidValue?: number;
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
  isBuy,
  sharesInMarket,
  minBidValue,
}) => {
  const { gameState } = useGame();
  const [shareValue, setShareValue] = useState<number>(1);
  const [marketOrderBidValue, setMarketOrderBidValue] = useState<number>(
    defaultValue || 0
  );
  useEffect(() => {
    handleShares(minValue);
    handleValueChange(defaultValue || 0);
  }, []);
  return (
    <div className="flex flex-col text-center items-center center-content justify-center gap-2">
      {/* 
      No need for this in market orders, gonna take this order counter out of market orders for now.
      <OrderCounter
        ordersRemaining={ordersRemaining}
        maxOrders={MAX_MARKET_ORDER_ACTIONS}
      /> */}
      <BuyOrSell
        handleSelectionIsBuy={handleSelectionIsBuy}
        isIpo={isIpo}
        showBuy={sharesInMarket > 0 || true}
      />
      {gameState.distributionStrategy == DistributionStrategy.BID_PRIORITY &&
        isBuy &&
        sharesInMarket > 0 && (
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
            min={minBidValue || 0}
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
  handleShares: (value: number) => void;
  ordersRemaining: number;
  maxValue: number;
  minValue: number;
}

const TabContentSO: React.FC<TabContentPropsSO> = ({
  company,
  handleShares,
  ordersRemaining,
  maxValue,
  minValue,
}) => {
  return (
    <div className="flex flex-col text-center items-center center-content justify-center gap-2">
      <p>
        Note that short order market values may fluctuate before action is
        resolved.
      </p>
      <OrderCounter
        ordersRemaining={ordersRemaining}
        maxOrders={MAX_SHORT_ORDER_ACTIONS}
      />
      <ShortOrderInput
        company={company}
        handleShares={handleShares}
        minValue={minValue}
        maxValue={maxValue}
      />
    </div>
  );
};

interface TabContentPropsLO {
  handleLimitOrderChange: (limitOrderValue: number) => void;
  handleSelectionIsBuy: (selection: boolean) => void;
  ordersRemaining: number;
  isBuy?: boolean;
  maxValue: number;
  minValue: number;
  defaultValue?: number;
  handleShares: (event: number) => void;
  handleValueChange: (event: number) => void;
}

const TabContentLO: React.FC<TabContentPropsLO> = ({
  handleLimitOrderChange,
  handleSelectionIsBuy,
  ordersRemaining,
  isBuy,
  handleShares,
  handleValueChange,
  maxValue,
  minValue,
  defaultValue,
}) => {
  return (
    <div className="flex flex-col text-center items-center center-content justify-center gap-2">
      <OrderCounter
        ordersRemaining={ordersRemaining}
        maxOrders={MAX_LIMIT_ORDER_ACTIONS}
      />
      <LimitOrderInput
        handleLimitOrder={handleLimitOrderChange}
        handleSelectionIsBuy={handleSelectionIsBuy}
        isBuy={isBuy}
        handleShares={handleShares}
        handleValueChange={handleValueChange}
        maxValue={maxValue}
        minValue={minValue}
        defaultValue={defaultValue}
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
    where: { playerId: authPlayer?.id, stockRoundId },
  });
  useEffect(() => {
    refetch();
  }, [currentPhase?.name]);
  if (isLoading) return null;
  if (!authPlayer) return null;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <span>Cash On Hand</span>
        <CurrencyDollarIcon className="w-6 h-6 size-3" />
        <span>{authPlayer.cashOnHand}</span>
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
          {authPlayer.cashOnHand - (currentOrderValue || 0)}
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
  const { closeDrawer } = useDrawer();
  const { gameId, gameState, authPlayer, currentPhase, refetchAuthPlayer } =
    useGame();
  const { data: playerOrders } =
    trpc.playerOrder.listPlayerOrdersWithCompany.useQuery({
      where: {
        stockRoundId: currentPhase?.stockRoundId,
        playerId: authPlayer?.id,
      },
    });
  const { data: playerWithShares, isLoading: isLoadingPlayerWithShares } =
    trpc.player.playerWithShares.useQuery({
      where: { id: authPlayer?.id },
    });
  const { data: company, isLoading: companyLoading } =
    trpc.company.getCompanyWithShares.useQuery({
      id: currentOrder.id,
    });
  const [isLoadingPlayerOrder, setIsLoadingPlayerOrder] = useState(false);
  const createPlayerOrder = trpc.playerOrder.createPlayerOrder.useMutation({
    onSuccess: () => {
      handlePlayerInputConfirmed();
      closeDrawer();
      refetchAuthPlayer();
      setIsSubmit(true);
    },
    onSettled: () => {
      setIsLoadingPlayerOrder(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
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
    if (orderType === OrderType.MARKET) {
      if (isBuy) {
        if (isIpo) {
          setMaxValue(
            company?.Share.filter(
              (share) => share.location === ShareLocation.IPO
            ).length || 0
          );
          setMinValue(1);
        } else {
          setMaxValue(company?.Share.length || 0);
          setMinValue(1);
        }
      } else {
        setMaxValue(company?.Share.length || 1);
        setMinValue(1);
      }
    } else if (orderType === OrderType.LIMIT) {
      if (isBuy) {
        setMaxValue(1);
        setMinValue(1);
      } else {
        setMaxValue(company?.Share.length || 0);
        setMinValue(1);
      }
    } else {
      setMinValue(1);
      setMaxValue(company?.Share.length || 0);
    }
  }, [isBuy, isIpo, company?.Share]);

  if (!gameId || !gameState || !authPlayer) return null;
  const currentOrderValue = calculatePseudoOrderValue({
    orderType,
    quantity: share,
    currentStockPrice: orderValue || currentOrder.currentStockPrice,
    premium: 0, // TODO: Fill for option orders
    isBuy,
  });
  const handleConfirm = () => {
    setIsLoadingPlayerOrder(true);
    createPlayerOrder.mutate({
      playerId: authPlayer.id,
      companyId: currentOrder.id,
      quantity: share,
      value: orderValue ?? company?.currentStockPrice,
      isSell: !!!isBuy,
      orderType,
      location: isIpo ? ShareLocation.IPO : ShareLocation.OPEN_MARKET,
    });
  };
  const handleSelectionChange = (key: React.Key) => {
    switch (key) {
      case "mo":
        if (isIpo) {
          setIsBuy(true);
        } else {
          setIsBuy(true);
        }
        setOrderType(OrderType.MARKET);
        break;
      case "lo":
        setIsBuy(true);
        setOrderType(OrderType.LIMIT);
        break;
      case "so":
        setOrderType(OrderType.SHORT);
        break;
    }
  };
  const sharesOwnedInCompany =
    playerWithShares?.Share.filter(
      (share) => share.companyId === currentOrder.id
    ).length || 0;
  return (
    <div className="flex flex-col justify-center items-center gap-1 min-w-80 max-w-96">
      <div className="flex items-center gap-1">
        <span>Shares Owned</span>
        {!isLoadingPlayerWithShares && playerWithShares && (
          <ShareComponent
            name={currentOrder.name}
            quantity={sharesOwnedInCompany}
            price={currentOrder.currentStockPrice}
          />
        )}
      </div>
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
        <div className="flex flex-col gap-1 mt-2">
          <Tabs
            aria-label="Dynamic tabs"
            items={tabs}
            onSelectionChange={handleSelectionChange}
          >
            <Tab key="mo" title={"MARKET ORDER"} className="w-full">
              <Card className="min-w-[250px]">
                <CardBody>
                  <TabContentMO
                    handleSelectionIsBuy={setIsBuy}
                    handleShares={setShare}
                    handleValueChange={setOrderValue}
                    ordersRemaining={authPlayer.marketOrderActions}
                    isIpo={isIpo}
                    maxValue={maxValue}
                    minValue={minValue}
                    defaultValue={
                      isIpo
                        ? currentOrder.ipoAndFloatPrice
                        : currentOrder.currentStockPrice
                    }
                    minBidValue={
                      isIpo
                        ? currentOrder.ipoAndFloatPrice
                        : currentOrder.currentStockPrice
                    }
                    isBuy={isBuy}
                    sharesInMarket={
                      company?.Share.filter(
                        (share) =>
                          share.location ===
                          (isIpo
                            ? ShareLocation.IPO
                            : ShareLocation.OPEN_MARKET)
                      ).length || 0
                    }
                  />
                </CardBody>
              </Card>
            </Tab>
            {!isIpo && gameState.useLimitOrders && (
              <Tab key="lo" title={"LIMIT ORDER"} className="w-full">
                <Card>
                  <CardBody>
                    <TabContentLO
                      isBuy={isBuy}
                      handleLimitOrderChange={setOrderValue}
                      handleSelectionIsBuy={setIsBuy}
                      ordersRemaining={authPlayer.limitOrderActions}
                      maxValue={maxValue}
                      minValue={minValue}
                      handleShares={setShare}
                      handleValueChange={setOrderValue}
                      defaultValue={currentOrder.currentStockPrice}
                    />
                  </CardBody>
                </Card>
              </Tab>
            )}
            {!isIpo && gameState.useShortOrders && (
              <Tab key="so" title={"SHORT ORDER"} className="w-full">
                <Card>
                  <CardBody>
                    <TabContentSO
                      company={currentOrder}
                      handleShares={setShare}
                      ordersRemaining={authPlayer.shortOrderActions}
                      maxValue={Math.min(maxValue, MAX_SHORT_ORDER_QUANTITY)}
                      minValue={1}
                    />
                  </CardBody>
                </Card>
              </Tab>
            )}
          </Tabs>
          <div className="flex justify-center gap-2">
            <DebounceButton
              onClick={handleConfirm}
              isLoading={isLoadingPlayerOrder}
            >
              Confirm
            </DebounceButton>
            <Drawer.Close asChild>
              <Button onClick={handleCancel}>Cancel</Button>
            </Drawer.Close>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerOrderInput;
