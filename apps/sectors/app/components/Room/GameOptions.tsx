import React, { useState, useEffect } from "react";
import { Select, SelectItem } from "@nextui-org/react";
import { DistributionStrategy } from "@server/prisma/prisma.client";

type ValueMap = {
  bankPoolNumber: { [key: number]: number };
  startingCashOnHand: { [key: number]: number };
  consumerPoolNumber: { [key: number]: number };
  distributionStrategy: { [key: number]: DistributionStrategy };
  gameMaxTurns: { [key: number]: number };
};

type GameOptionsKeys = keyof ValueMap;

interface GameOptionsProps {
  initialBankPoolNumber?: number;
  initialConsumerPoolNumber?: number;
  initialStartingCashOnHand?: number;
  initialDistributionStrategy?: DistributionStrategy;
  initialGameMaxTurns: number;
  onOptionsChange?: (options: GameOptionsState) => void;
}

interface GameOptionsState {
  bankPoolNumber: number;
  consumerPoolNumber: number;
  startingCashOnHand: number;
  distributionStrategy: DistributionStrategy;
  gameMaxTurns: number;
}

const GameOptions: React.FC<GameOptionsProps> = ({
  initialBankPoolNumber = 0,
  initialConsumerPoolNumber = 0,
  initialStartingCashOnHand = 0,
  initialDistributionStrategy = DistributionStrategy.FAIR_SPLIT,
  initialGameMaxTurns = 15,
  onOptionsChange,
}) => {
  const [options, setOptions] = useState<GameOptionsState>({
    bankPoolNumber: initialBankPoolNumber,
    consumerPoolNumber: initialConsumerPoolNumber,
    startingCashOnHand: initialStartingCashOnHand,
    distributionStrategy: initialDistributionStrategy,
    gameMaxTurns: initialGameMaxTurns,
  });

  useEffect(() => {
    onOptionsChange && onOptionsChange(options);
  }, [options]);

  const valueMap: ValueMap = {
    bankPoolNumber: {
      1: 7500,
      2: 10000,
      3: 12000,
      4: 15000,
      5: 20000,
    },
    startingCashOnHand: {
      1: 500,
      2: 750,
    },
    consumerPoolNumber: {
      1: 50,
      2: 75,
      3: 100,
    },
    distributionStrategy: {
      1: DistributionStrategy.FAIR_SPLIT,
      2: DistributionStrategy.BID_PRIORITY,
      3: DistributionStrategy.PRIORITY,
    },
    gameMaxTurns: {
      1: 8,
      2: 11,
      3: 15,
      4: 19,
      5: 23,
    },
  };

  const handleSelectChange = (name: GameOptionsKeys, key: number) => {
    const value = valueMap[name][key];
    setOptions((prevOptions) => ({
      ...prevOptions,
      [name]: value,
    }));
  };

  return (
    <div className="p-4 rounded-t shadow-md bg-background">
      <h2 className="text-lg font-bold mb-4 text-sky-400/100">Game Options</h2>
      <div className="mb-4">
        <Select
          label="Bank Pool"
          size="lg"
          className="max-w-xs"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleSelectChange("bankPoolNumber", Number(e.target.value))
          }
        >
          <SelectItem key={1} value={1}>
            7,500 (Quick Game)
          </SelectItem>
          <SelectItem key={2} value={2}>
            10,000 (Short Game)
          </SelectItem>
          <SelectItem key={3} value={3}>
            12,000 (Standard Game)
          </SelectItem>
          <SelectItem key={4} value={4}>
            15,000 (Long Game)
          </SelectItem>
          <SelectItem key={5} value={5}>
            20,000 (Marathon)
          </SelectItem>
        </Select>
      </div>
      <div className="mb-4">
        <Select
          label="Starting Cash On Hand"
          size="lg"
          className="max-w-xs"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleSelectChange("startingCashOnHand", Number(e.target.value))
          }
        >
          <SelectItem key={1} value={1}>
            500 (Standard)
          </SelectItem>
          <SelectItem key={2} value={2}>
            750 (Beginner Friendly)
          </SelectItem>
        </Select>
      </div>
      <div className="mb-4">
        <Select
          label="Consumer Pool Number"
          size="lg"
          className="max-w-xs"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleSelectChange("consumerPoolNumber", Number(e.target.value))
          }
        >
          <SelectItem key={1} value={1}>
            50 (Cut-throat)
          </SelectItem>
          <SelectItem key={2} value={2}>
            75 (Standard)
          </SelectItem>
          <SelectItem key={3} value={3}>
            100 (Friendly Game)
          </SelectItem>
        </Select>
      </div>
      <div className="mb-4">
        <Select
          label="Distribution Strategy"
          size="lg"
          className="max-w-xs"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleSelectChange("distributionStrategy", Number(e.target.value))
          }
        >
          <SelectItem key={1} value={1}>
            Fair Split
          </SelectItem>
          <SelectItem key={2} value={2}>
            Bid Priority
          </SelectItem>
          <SelectItem key={3} value={3}>
            Priority
          </SelectItem>
        </Select>
      </div>
      <div className="mb-4">
        <Select
          label="Game Max Turns"
          size="lg"
          className="max-w-xs"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleSelectChange("gameMaxTurns", Number(e.target.value))
          }
        >
          <SelectItem key={1} value={1}>
            8
          </SelectItem>
          <SelectItem key={2} value={2}>
            11
          </SelectItem>
          <SelectItem key={3} value={3}>
            15
          </SelectItem>
          <SelectItem key={4} value={4}>
            19
          </SelectItem>
          <SelectItem key={5} value={5}>
            23
          </SelectItem>
        </Select>
      </div>
    </div>
  );
};

export default GameOptions;
