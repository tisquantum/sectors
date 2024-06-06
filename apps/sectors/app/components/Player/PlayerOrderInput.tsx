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
import React, {
  ChangeEvent,
  ChangeEventHandler,
  useEffect,
  useState,
} from "react";

const RiskAssessment = ({ termValue }) => {
  const getRiskMetrics = (term) => {
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

const ShortOrderInput = () => {
  const [termValue, setTermValue] = useState(2);
  const [maxStockValue, setMaxStockValue] = useState(4);
  const [minStockValue, setMinStockValue] = useState(1);
  const [shareValue, setShareValue] = useState(1);
  useEffect(() => {
    setMaxStockValue(getMaxStockValue(termValue));
    setMinStockValue(getMinStockValue(termValue));
  }, [termValue]);

  useEffect(() => {
    setShareValue(minStockValue);
  }, [minStockValue]);

  const handleTermChange = (value) => {
    if (typeof value === "number") {
      setTermValue(value);
    }
  };

  const handleShareChange = (value) => {
    if (typeof value === "number") {
      setShareValue(value);
    }
  };

  function getMaxStockValue(term) {
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
  }

  function getMinStockValue(term) {
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
  }

  return (
    <>
      <RiskAssessment termValue={termValue} />
      <Slider
        key={`term-slider-${termValue}`} // Add key prop
        size="md"
        step={1}
        color="foreground"
        label="Term"
        showSteps={true}
        maxValue={5}
        minValue={2}
        defaultValue={2}
        value={termValue}
        onChange={handleTermChange}
        className="max-w-md"
      />
      {termValue === 2 && (
        <Slider
          size="md"
          step={1}
          color="foreground"
          label="Shares"
          showSteps={true}
          maxValue={4}
          minValue={1}
          defaultValue={1}
          className="max-w-md"
          marks={[
            {
              value: 1,
              label: "1",
            },
            {
              value: 4,
              label: "4",
            },
          ]}
        />
      )}
      {termValue === 3 && (
        <Slider
          size="md"
          step={1}
          color="foreground"
          label="Shares"
          showSteps={true}
          maxValue={6}
          minValue={3}
          defaultValue={3}
          className="max-w-md"
          marks={[
            {
              value: 3,
              label: "3",
            },
            {
              value: 6,
              label: "6",
            },
          ]}
        />
      )}
      {termValue === 4 && (
        <Slider
          size="md"
          step={1}
          color="foreground"
          label="Shares"
          showSteps={true}
          maxValue={8}
          minValue={5}
          defaultValue={5}
          className="max-w-md"
          marks={[
            {
              value: 5,
              label: "5",
            },
            {
              value: 8,
              label: "8",
            },
          ]}
        />
      )}
      {termValue === 5 && (
        <Slider
          size="md"
          step={1}
          color="foreground"
          label="Shares"
          showSteps={true}
          maxValue={10}
          minValue={7}
          defaultValue={7}
          className="max-w-md"
          marks={[
            {
              value: 7,
              label: "7",
            },
            {
              value: 10,
              label: "10",
            },
          ]}
        />
      )}
    </>
  );
};
const OrderCounter: React.FC<{ maxOrders: number }> = ({ maxOrders }) => {
  const ordersRemaining = maxOrders / 2;
  //Shows orders remaining
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

const LimitOrderInput = () => {
  const [isBuy, setIsBuy] = useState(true);
  const handleSelection: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (event.target.value === "cancel") {
      setIsBuy(false);
    } else {
      setIsBuy(true);
    }
  };
  return (
    <>
      <BuyOrSell handleSelection={handleSelection} alsoCancel />
      {isBuy ? (
        <Input
          id="loAmount"
          type="number"
          label="Limit Order Amount"
          placeholder="0.00"
          labelPlacement="inside"
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
const BuyOrSell = ({
  alsoCancel,
  handleSelection,
}: {
  alsoCancel?: boolean;
  handleSelection?: (selection: ChangeEvent<HTMLInputElement>) => void;
}) => (
  <RadioGroup
    onChange={(event) => (handleSelection ? handleSelection(event) : undefined)}
    orientation="horizontal"
  >
    <Radio defaultChecked value="buy">Buy</Radio>
    <Radio value="sell">Sell</Radio>
    {alsoCancel && <Radio value="cancel">Cancel Order</Radio>}
  </RadioGroup>
);
let tabs = [
  {
    id: "mo",
    label: "MO",
    content: (
      <div className="flex flex-col text-center items-center center-content justify-center gap-2">
        <OrderCounter maxOrders={4} />
        <BuyOrSell />
        <Slider
          size="md"
          step={1}
          color="foreground"
          label="Shares"
          showSteps={true}
          maxValue={10}
          minValue={1}
          defaultValue={1}
          className="max-w-md"
        />
      </div>
    ),
  },
  {
    id: "lo",
    label: "LO",
    content: (
      <div className="flex flex-col text-center items-center center-content justify-center gap-2">
        <OrderCounter maxOrders={7} />
        <LimitOrderInput />
      </div>
    ),
  },
  {
    id: "so",
    label: "SO",
    content: (
      <div className="flex flex-col text-center items-center center-content justify-center gap-2">
        <OrderCounter maxOrders={3} />
        <ShortOrderInput />
      </div>
    ),
  },
];

const PlayerOrderInput = ({ currentOrder, handleCancel }: any) => {
  return (
    <div className="flex flex-col justify-center items-center gap-1 min-w-80">
      {currentOrder && <h2>{currentOrder.name}</h2>}
      <Tabs aria-label="Dynamic tabs" items={tabs}>
        {(item) => (
          <Tab key={item.id} title={item.label} className="w-full">
            <Card>
              <CardBody>{item.content}</CardBody>
            </Card>
          </Tab>
        )}
      </Tabs>
      <div className="flex justify-center gap-2">
        <Button>Confirm</Button>
        <Button>Pass</Button>
        <Button onClick={handleCancel}>Cancel</Button>
      </div>
    </div>
  );
};

export default PlayerOrderInput;
