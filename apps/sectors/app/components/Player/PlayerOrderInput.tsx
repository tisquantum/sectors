"use client";

import { CurrencyDollarIcon } from "@heroicons/react/24/solid";
import {
  Button,
  Card,
  CardBody,
  Checkbox,
  CheckboxGroup,
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
  OrderType,
  PlayerOrder,
  Prisma,
  StockLocation,
} from "@server/prisma/prisma.client";
import React, {
  ChangeEvent,
  ChangeEventHandler,
  useEffect,
  useState,
} from "react";
import { useGame } from "../Game/GameContext";
import {
  MAX_LIMIT_ORDER,
  MAX_MARKET_ORDER,
  MAX_SHORT_ORDER,
} from "@server/data/constants";
import { PlayerOrderWithCompany } from "@server/prisma/prisma.types";
import { getPseudoSpend } from "@server/data/helpers";

const RiskAssessment = ({ termValue }: { termValue: number }) => {
  const getRiskMetrics = (term: number) => {
    switch (term) {
      case 2:
        return { interestRate: "40%", maxStockValue: 4 };
      case 3:
        return { interestRate: "30%", maxStockValue: 6 };
      case 4:
        return { interestRate: "20%", maxStockValue: 8 };
      case 5:
        return { interestRate: "15%", maxStockValue: 10 };
      default:
        return { interestRate: "N/A", maxStockValue: 1 };
    }
  };

  const { interestRate, maxStockValue } = getRiskMetrics(termValue);

  return (
    <div>
      <div>Loan Interest Rate {interestRate}</div>
    </div>
  );
};

const ShortOrderInput: React.FC<{
  onTermChange: (value: number) => void;
  onShareChange: (value: number) => void;
}> = ({ onTermChange, onShareChange }) => {
  const [termValue, setTermValue] = useState<number>(2);
  const [maxStockValue, setMaxStockValue] = useState<number>(4);
  const [minStockValue, setMinStockValue] = useState<number>(1);
  const [shareValue, setShareValue] = useState<number>(1);

  useEffect(() => {
    setMaxStockValue(getMaxStockValue(termValue));
    setMinStockValue(getMinStockValue(termValue));
  }, [termValue]);

  useEffect(() => {
    setShareValue(minStockValue);
  }, [minStockValue]);

  const handleTermChange = (value: number | number[]) => {
    //if array, use zero
    if (Array.isArray(value)) {
      value = value[0];
    }
    setTermValue(value);
  };

  const handleShareChange = (value: number | number[]) => {
    //if array, use zero
    if (Array.isArray(value)) {
      value = value[0];
    }
    setShareValue(value);
  };

  const getMaxStockValue = (term: number | number[]): number => {
    switch (term) {
      case 2:
        return 4;
      case 3:
        return 6;
      case 4:
        return 8;
      case 5:
        return 10;
      default:
        return 1;
    }
  };

  const getMinStockValue = (term: number): number => {
    switch (term) {
      case 2:
        return 1;
      case 3:
        return 3;
      case 4:
        return 5;
      case 5:
        return 7;
      default:
        return 1;
    }
  };

  return (
    <>
      <RiskAssessment termValue={termValue} />
      <Slider
        key={`term-slider-${termValue}`}
        size="md"
        step={1}
        color="foreground"
        label="Term"
        showSteps={true}
        maxValue={5}
        minValue={2}
        defaultValue={2}
        onChangeEnd={handleTermChange}
        className="max-w-md"
      />
      {termValue >= 2 && termValue <= 5 && (
        <Slider
          size="md"
          step={1}
          color="foreground"
          label="Shares"
          showSteps={true}
          maxValue={maxStockValue}
          minValue={minStockValue}
          defaultValue={minStockValue}
          onChangeEnd={handleShareChange}
          className="max-w-md"
          marks={[
            { value: minStockValue, label: `${minStockValue}` },
            { value: maxStockValue, label: `${maxStockValue}` },
          ]}
        />
      )}
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
}: {
  handleLimitOrder: (limitOrderValue: number) => void;
  handleSelectionIsBuy: (selection: boolean) => void;
}) => {
  const [isBuy, setIsBuy] = useState(true);
  const [limitOrderValue, setLimitOrderValue] = useState<number>(0);
  useEffect(() => {
    handleLimitOrder(limitOrderValue);
  }, [limitOrderValue]);
  return (
    <>
      <BuyOrSell handleSelectionIsBuy={handleSelectionIsBuy} alsoCancel />
      {isBuy ? (
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
      ) : (
        <CheckboxGroup
          label="Select Pending Limit Orders to Cancel"
          defaultValue={["company-a", "company-b"]}
          orientation="horizontal"
          className="max-w-md"
        >
          <Checkbox value="company-a">CAP-LO+@35</Checkbox>
          <Checkbox value="company-b">CAP-LO+@35</Checkbox>
          <Checkbox value="company-c">AWS-LO-@20</Checkbox>
        </CheckboxGroup>
      )}
    </>
  );
};
interface BuyOrSellProps {
  alsoCancel?: boolean;
  handleSelectionIsBuy?: (selection: boolean) => void;
}

const BuyOrSell: React.FC<BuyOrSellProps> = ({
  alsoCancel,
  handleSelectionIsBuy,
}) => {
  const handleSelection = (event: ChangeEvent<HTMLInputElement>) => {
    if (handleSelectionIsBuy) {
      handleSelectionIsBuy(event.target.value === "buy");
    }
  };

  return (
    <RadioGroup onChange={handleSelection} orientation="horizontal">
      <Radio defaultChecked value="buy">
        Buy
      </Radio>
      <Radio value="sell">Sell</Radio>
      {alsoCancel && <Radio value="cancel">Cancel Order</Radio>}
    </RadioGroup>
  );
};

interface TabContentProps {
  handleSelectionIsBuy: (event: boolean) => void;
  handleShares: (event: number) => void;
  ordersRemaining: number;
}

const TabContentMO: React.FC<TabContentProps> = ({
  handleSelectionIsBuy,
  handleShares,
  ordersRemaining,
}) => {
  return (
    <div className="flex flex-col text-center items-center center-content justify-center gap-2">
      <OrderCounter
        ordersRemaining={ordersRemaining}
        maxOrders={MAX_MARKET_ORDER}
      />
      <BuyOrSell handleSelectionIsBuy={handleSelectionIsBuy} />
      <Slider
        size="md"
        step={1}
        color="foreground"
        label="Shares"
        showSteps={true}
        maxValue={10}
        minValue={1}
        onChange={(value) => {
          if (Array.isArray(value)) {
            value = value[0];
          }
          handleShares(value);
        }}
        defaultValue={1}
        className="max-w-md"
      />
    </div>
  );
};

interface TabContentPropsSO {
  onTermChange: (value: number) => void;
  onShareChange: (value: number) => void;
  ordersRemaining: number;
}

const TabContentSO: React.FC<TabContentPropsSO> = ({
  onTermChange,
  onShareChange,
  ordersRemaining,
}) => {
  return (
    <div className="flex flex-col text-center items-center center-content justify-center gap-2">
      <OrderCounter
        ordersRemaining={ordersRemaining}
        maxOrders={MAX_SHORT_ORDER}
      />
      <ShortOrderInput
        onTermChange={onTermChange}
        onShareChange={onShareChange}
      />
    </div>
  );
};

interface TabContentPropsLO {
  handleLimitOrderChange: (limitOrderValue: number) => void;
  handleSelectionIsBuy: (selection: boolean) => void;
  ordersRemaining: number;
}

const TabContentLO: React.FC<TabContentPropsLO> = ({
  handleLimitOrderChange,
  handleSelectionIsBuy,
  ordersRemaining,
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
}: {
  stockRoundId: number;
  currentOrderValue?: number;
}) => {
  const { authPlayer } = useGame();
  const { data: playerOrders, isLoading } =
    trpc.playerOrder.listPlayerOrdersWithCompany.useQuery({
      where: { playerId: authPlayer.id, stockRoundId },
    });
  if (isLoading) return null;

  const pseudoSpend = playerOrders ? getPseudoSpend(playerOrders) : 0;

  const netSpend = currentOrderValue ?? 0 + pseudoSpend;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <CurrencyDollarIcon className="w-6 h-6 size-3" />
        <span>{authPlayer.cashOnHand}</span>
      </div>
      <div className="flex items-center gap-1">
        After Orders Placed:
        <CurrencyDollarIcon className="w-6 h-6" />
        <span>{authPlayer.cashOnHand - netSpend}</span>
      </div>
    </div>
  );
};

const PlayerOrderInput = ({
  currentOrder,
  handleCancel,
  isIpo,
}: {
  currentOrder: Company;
  handleCancel: () => void;
  isIpo: boolean;
}) => {
  const { gameId, gameState, authPlayer, currentPhase } = useGame();
  const createPlayerOrder = trpc.playerOrder.createPlayerOrder.useMutation();
  const [term, setTerm] = useState(2);
  const [share, setShare] = useState(1);
  const [limitOrderValue, setLimitOrderValue] = useState(0);
  const [isBuy, setIsBuy] = useState(true);
  const [isSubmit, setIsSubmit] = useState(false);
  useEffect(() => {
    setIsSubmit(false);
  }, [currentPhase?.name]);
  if (!gameId || !gameState) return null;
  const currentOrderValue = share * (currentOrder.currentStockPrice ?? 0);
  const handleConfirm = () => {
    createPlayerOrder.mutate({
      gameId,
      stockRoundId: gameState.currentStockRoundId ?? 0,
      playerId: authPlayer.id,
      companyId: currentOrder.id,
      phaseId: gameState.currentPhaseId ?? "",
      quantity: share,
      term,
      value: limitOrderValue,
      isSell: !!!isBuy,
      orderType: OrderType.LIMIT,
      location: StockLocation.OPEN_MARKET,
    });
    setIsSubmit(true);
  };
  return (
    <div className="flex flex-col justify-center items-center gap-1 min-w-80 max-w-96">
      {currentOrder && <h2>{currentOrder.name}</h2>}
      <span>{isIpo ? "IPO" : "OPEN MARKET"}</span>
      <PseudoBalance
        stockRoundId={currentPhase?.stockRoundId ?? 0}
        currentOrderValue={currentOrderValue}
      />
      <Tabs aria-label="Dynamic tabs" items={tabs}>
        <Tab key="mo" title={"MARKET ORDER"} className="w-full">
          <Card>
            <CardBody>
              <TabContentMO
                handleSelectionIsBuy={setIsBuy}
                handleShares={setShare}
                ordersRemaining={authPlayer.marketOrderActions}
              />
            </CardBody>
          </Card>
        </Tab>
        <Tab key="lo" title={"LIMIT ORDER"} className="w-full">
          <Card>
            <CardBody>
              <TabContentLO
                handleLimitOrderChange={setLimitOrderValue}
                handleSelectionIsBuy={setIsBuy}
                ordersRemaining={authPlayer.limitOrderActions}
              />
            </CardBody>
          </Card>
        </Tab>
        <Tab key="so" title={"SHORT ORDER"} className="w-full">
          <Card>
            <CardBody>
              <TabContentSO
                onTermChange={setTerm}
                onShareChange={setShare}
                ordersRemaining={authPlayer.shortOrderActions}
              />
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
      {isSubmit ? (
        <div className="flex justify-center gap-2">
          <span>Order Submitted.</span>
        </div>
      ) : (
        <div className="flex justify-center gap-2">
          <Button onClick={handleConfirm}>Confirm</Button>
          <Button onClick={handleCancel}>Cancel</Button>
        </div>
      )}
    </div>
  );
};

export default PlayerOrderInput;
