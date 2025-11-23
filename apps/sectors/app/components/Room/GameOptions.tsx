import React, { useState, useEffect, ReactNode } from "react";
import { Checkbox, Select, SelectItem, Tooltip } from "@nextui-org/react";
import {
  DistributionStrategy,
  OperationMechanicsVersion,
} from "@server/prisma/prisma.client";
import {
  GAME_SETUP_DEFAULT_BANK_POOL_NUMBER,
  GAME_SETUP_DEFAULT_CONSUMER_POOL_NUMBER,
  GAME_SETUP_DEFAULT_DISTRIBUTION_STRATEGY,
  GAME_SETUP_DEFAULT_GAME_MAX_TURNS,
  GAME_SETUP_DEFAULT_PLAYER_ORDERS_CONCEALED,
  GAME_SETUP_DEFAULT_STARTING_CASH_ON_HAND,
  GAME_SETUP_DEFAULT_TIMERLESS,
} from "@server/data/constants";
import { RiInformation2Fill } from "@remixicon/react";
import {
  baseToolTipStyle,
  tooltipParagraphStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";

type ValueMap = {
  bankPoolNumber: { [key: number]: number };
  startingCashOnHand: { [key: number]: number };
  consumerPoolNumber: { [key: number]: number };
  distributionStrategy: { [key: number]: DistributionStrategy };
  gameMaxTurns: { [key: number]: number };
  playerOrdersConcealed: { [key: number]: boolean };
  useOptionOrders: { [key: number]: boolean };
  useShortOrders: { [key: number]: boolean };
  useLimitOrders: { [key: number]: boolean };
  isTimerless: { [key: number]: boolean };
  bots: { [key: number]: number };
  operationMechanicsVersion: { [key: number]: OperationMechanicsVersion };
};

type GameOptionsKeys = keyof ValueMap;

interface GameOptionsProps {
  onOptionsChange?: (options: GameOptionsState) => void;
}

interface GameOptionsState {
  bankPoolNumber: number;
  consumerPoolNumber: number;
  startingCashOnHand: number;
  distributionStrategy: DistributionStrategy;
  gameMaxTurns: number;
  playerOrdersConcealed: boolean;
  useOptionOrders: boolean;
  useShortOrders: boolean;
  useLimitOrders: boolean;
  isTimerless: boolean;
  bots: number;
  operationMechanicsVersion: OperationMechanicsVersion;
}

export const GameOptionDescription: React.FC<{
  name: string;
  description: ReactNode;
}> = ({ name, description }) => (
  <div className="relative flex gap-1 items-center">
    <div className="text-lg font-bold mb-2">{name}</div>
    <Tooltip
      classNames={{ base: baseToolTipStyle }}
      className={tooltipStyle}
      content={description}
    >
      <div>
        <RiInformation2Fill className="text-sky-400/100 mb-2" />
      </div>
    </Tooltip>
  </div>
);

const GameOptions: React.FC<GameOptionsProps> = ({ onOptionsChange }) => {
  const [options, setOptions] = useState<GameOptionsState>({
    bankPoolNumber: GAME_SETUP_DEFAULT_BANK_POOL_NUMBER,
    consumerPoolNumber: GAME_SETUP_DEFAULT_CONSUMER_POOL_NUMBER,
    startingCashOnHand: GAME_SETUP_DEFAULT_STARTING_CASH_ON_HAND,
    distributionStrategy: GAME_SETUP_DEFAULT_DISTRIBUTION_STRATEGY,
    gameMaxTurns: GAME_SETUP_DEFAULT_GAME_MAX_TURNS,
    playerOrdersConcealed: GAME_SETUP_DEFAULT_PLAYER_ORDERS_CONCEALED,
    useOptionOrders: false,
    useShortOrders: false,
    useLimitOrders: false,
    isTimerless: GAME_SETUP_DEFAULT_TIMERLESS,
    bots: 0,
    operationMechanicsVersion: OperationMechanicsVersion.MODERN,
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
      1: 200,
      2: 300,
      3: 400,
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
    playerOrdersConcealed: {
      1: true,
      2: false,
    },
    useOptionOrders: {
      1: true,
      2: false,
    },
    useShortOrders: {
      1: true,
      2: false,
    },
    useLimitOrders: {
      1: true,
      2: false,
    },
    isTimerless: {
      1: true,
      2: false,
    },
    bots: {
      1: 0,
      2: 1,
      3: 2,
      4: 3,
      5: 4,
      6: 5,
      7: 6,
      8: 7,
      9: 8,
      10: 9,
    },
    operationMechanicsVersion: {
      1: OperationMechanicsVersion.MODERN,
      2: OperationMechanicsVersion.LEGACY,
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
    <div className="p-4 rounded-t shadow-md bg-background relative">
      <h2 className="text-lg font-bold mb-4 text-sky-400/100">Game Options</h2>
      <div className="mb-4">
        <GameOptionDescription
          name="Bank Pool Number"
          description={
            <p className={tooltipParagraphStyle}>
              The amount of money the bank starts with.
            </p>
          }
        />
        <Select
          size="lg"
          className="max-w-xs"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleSelectChange("bankPoolNumber", Number(e.target.value))
          }
          defaultSelectedKeys={["1"]}
          popoverProps={{
            color: "primary",
            className: "pointer-events-auto",
          }}
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
        <GameOptionDescription
          name="Starting Cash on Hand"
          description={
            <p className={tooltipParagraphStyle}>
              The amount of money each player starts the game with.
            </p>
          }
        />
        <Select
          size="lg"
          className="max-w-xs"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            handleSelectChange("startingCashOnHand", Number(e.target.value));
          }}
          defaultSelectedKeys={["2"]}
          popoverProps={{
            color: "primary",
            className: "pointer-events-auto",
          }}
          aria-label="Starting Cash on Hand"
        >
          <SelectItem key={1} value={1}>
            200 (Business Elite)
          </SelectItem>
          <SelectItem key={2} value={2}>
            300 (Standard)
          </SelectItem>
          <SelectItem key={3} value={3}>
            400 (Beginner Friendly)
          </SelectItem>
        </Select>
      </div>
      <div className="mb-4">
        <GameOptionDescription
          name="Consumer Pool Number"
          description={
            <p className={tooltipParagraphStyle}>
              The total amount of consumers available to purchase product.
            </p>
          }
        />
        <Select
          size="lg"
          className="max-w-xs"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleSelectChange("consumerPoolNumber", Number(e.target.value))
          }
          defaultSelectedKeys={["2"]}
          popoverProps={{
            color: "primary",
            className: "pointer-events-auto",
          }}
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
        <GameOptionDescription
          name="Distribution Strategy"
          description={
            <div>
              <p>
                Handles how shares are distributed given there are conflicting
                orders during a stock round.
              </p>
              <ul>
                <li>
                  <strong>Bid Strategy:</strong>
                  <ul>
                    <li>
                      Bids are resolved in descending bid ask price when using
                      bid priority.
                    </li>
                    <li>
                      In case of bid ties, the player with the highest player
                      priority resolves first.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Priority Strategy:</strong>
                  <ul>
                    <li>
                      Orders are resolved according to{" "}
                      <strong>player priority</strong> order.
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          }
        />
        <Select
          size="lg"
          className="max-w-xs"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleSelectChange("distributionStrategy", Number(e.target.value))
          }
          defaultSelectedKeys={["3"]}
          popoverProps={{
            color: "primary",
            className: "pointer-events-auto",
          }}
        >
          {/* <SelectItem key={1} value={1}>
            Fair Split
          </SelectItem> */}
          <SelectItem key={2} value={2}>
            Bid Strategy
          </SelectItem>
          <SelectItem key={3} value={3}>
            Priority Strategy
          </SelectItem>
        </Select>
      </div>
      <div className="mb-4">
        <GameOptionDescription
          name="Game Max Turns"
          description={
            <p className={tooltipParagraphStyle}>
              The maximum amount of turns the game will run before ending.
            </p>
          }
        />
        <Select
          size="lg"
          className="max-w-xs"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleSelectChange("gameMaxTurns", Number(e.target.value))
          }
          defaultSelectedKeys={["1"]}
          popoverProps={{
            color: "primary",
            className: "pointer-events-auto",
          }}
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
      <div className="mb-4 flex flex-col">
        <GameOptionDescription
          name="Player Orders Concealed"
          description={
            <p className={tooltipParagraphStyle}>
              Determines if player orders will be concealed from other players
              until all sub-stock rounds are completed.
            </p>
          }
        />
        <Select
          size="lg"
          className="max-w-xs"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleSelectChange("playerOrdersConcealed", Number(e.target.value))
          }
          defaultSelectedKeys={["2"]}
          popoverProps={{
            color: "primary",
            className: "pointer-events-auto",
          }}
        >
          <SelectItem key={1} value={1}>
            Yes
          </SelectItem>
          <SelectItem key={2} value={2}>
            No
          </SelectItem>
        </Select>
      </div>
      <div className="mb-4 flex flex-col">
        <GameOptionDescription
          name="Select Order Types"
          description={
            <p className={tooltipParagraphStyle}>
              Add or remove additional stock order types from the game.
            </p>
          }
        />
        <Checkbox isSelected={true} isDisabled>
          Market Orders
        </Checkbox>
        <Checkbox
          isSelected={options.useLimitOrders}
          onChange={(e) =>
            setOptions((prevOptions) => ({
              ...prevOptions,
              useLimitOrders: e.target.checked,
            }))
          }
        >
          Limit Orders
        </Checkbox>
        <Checkbox
          isSelected={options.useShortOrders}
          onChange={(e) =>
            setOptions((prevOptions) => ({
              ...prevOptions,
              useShortOrders: e.target.checked,
            }))
          }
        >
          Short Orders
        </Checkbox>
        <Checkbox
          isSelected={options.useOptionOrders}
          onChange={(e) =>
            setOptions((prevOptions) => ({
              ...prevOptions,
              useOptionOrders: e.target.checked,
            }))
          }
        >
          Options Orders
        </Checkbox>
      </div>
      <div className="mb-4 flex flex-col">
        <GameOptionDescription
          name="Timerless Game"
          description={
            <p className={tooltipParagraphStyle}>
              Determines if the game will run without a timer.
            </p>
          }
        />
        <Select
          size="lg"
          className="max-w-xs"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleSelectChange("isTimerless", Number(e.target.value))
          }
          defaultSelectedKeys={["1"]}
          popoverProps={{
            color: "primary",
            className: "pointer-events-auto",
          }}
        >
          <SelectItem key={1} value={1}>
            Yes
          </SelectItem>
          <SelectItem key={2} value={2}>
            No
          </SelectItem>
        </Select>
      </div>
      <div className="mb-4 flex flex-col">
        <GameOptionDescription
          name="Bots"
          description={
            <p className={tooltipParagraphStyle}>
              The amount of bots to be added to the game.
            </p>
          }
        />
        <Select
          size="lg"
          className="max-w-xs"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleSelectChange("bots", Number(e.target.value))
          }
          defaultSelectedKeys={["1"]}
          popoverProps={{
            color: "primary",
            className: "pointer-events-auto",
          }}
        >
          <SelectItem key={1} value={1}>
            0
          </SelectItem>
          <SelectItem key={2} value={2}>
            1
          </SelectItem>
          <SelectItem key={3} value={3}>
            2
          </SelectItem>
          <SelectItem key={4} value={4}>
            3
          </SelectItem>
          <SelectItem key={5} value={5}>
            4
          </SelectItem>
          <SelectItem key={6} value={6}>
            5
          </SelectItem>
          <SelectItem key={7} value={7}>
            6
          </SelectItem>
          <SelectItem key={8} value={8}>
            7
          </SelectItem>
          <SelectItem key={9} value={9}>
            8
          </SelectItem>
          <SelectItem key={10} value={10}>
            9
          </SelectItem>
        </Select>
      </div>
      <div className="mb-4 flex flex-col">
        <GameOptionDescription
          name="Operation Mechanics Version"
          description={
            <p className={tooltipParagraphStyle}>
              Operation Round game mechanics to use.
            </p>
          }
        />
        <Select
          size="lg"
          className="max-w-xs"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleSelectChange(
              "operationMechanicsVersion",
              Number(e.target.value)
            )
          }
          defaultSelectedKeys={["1"]}
          popoverProps={{
            color: "primary",
            className: "pointer-events-auto",
          }}
        >
          <SelectItem key={1} value={1}>
            Modern
          </SelectItem>
          <SelectItem key={2} value={2}>
            Legacy
          </SelectItem>
        </Select>
      </div>
    </div>
  );
};

export default GameOptions;
