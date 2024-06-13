import { Select, SelectItem } from "@nextui-org/react";
import { useState } from "react";

interface GameOptionsProps {
  initialBankPoolNumber?: number;
  initialConsumerPoolNumber?: number;
  initialStartingCashOnHand?: number;
  onOptionsChange?: (options: GameOptionsState) => void;
}

interface GameOptionsState {
  bankPoolNumber: number;
  consumerPoolNumber: number;
  startingCashOnHand: number;
}

const GameOptions: React.FC<GameOptionsProps> = ({
  initialBankPoolNumber = 0,
  initialConsumerPoolNumber = 0,
  initialStartingCashOnHand = 0,
  onOptionsChange,
}) => {
  const [options, setOptions] = useState<GameOptionsState>({
    bankPoolNumber: initialBankPoolNumber,
    consumerPoolNumber: initialConsumerPoolNumber,
    startingCashOnHand: initialStartingCashOnHand,
  });

  const handleSelectChange = (name: string, value: number) => {
    const newOptions = {
      ...options,
      [name]: value,
    };
    setOptions(newOptions);
    onOptionsChange && onOptionsChange(newOptions as GameOptionsState);
  };

  return (
    <div className="p-4 rounded-t shadow-md bg-background">
      <h2 className="text-lg font-bold mb-4 text-sky-400/100">Game Options</h2>
      <div className="mb-4">
        <Select
          label="Bank Pool"
          size="lg"
          className="max-w-xs"
          onChange={(e) =>
            handleSelectChange("bankPoolNumber", Number(e.target.value))
          }
        >
          <SelectItem key={1} value={7500}>
            7,500 (Quick Game)
          </SelectItem>
          <SelectItem key={2} value={10000}>
            10,000 (Short Game)
          </SelectItem>
          <SelectItem key={3} value={15000}>
            15,000 (Normal Game)
          </SelectItem>
          <SelectItem key={4} value={20000}>
            20,000 (Long Game)
          </SelectItem>
          <SelectItem key={5} value={30000}>
            30,000 (Marathon)
          </SelectItem>
        </Select>
      </div>
      <div className="mb-4">
        <Select
          label="Starting Cash On Hand"
          size="lg"
          className="max-w-xs"
          onChange={(e) =>
            handleSelectChange("startingCashOnHand", Number(e.target.value))
          }
        >
          <SelectItem key={1} value={500}>
            500 (Standard)
          </SelectItem>
          <SelectItem key={2} value={750}>
            750 (Beginner Friendly)
          </SelectItem>
        </Select>
      </div>
      <div className="mb-4">
        <Select
          label="Consumer Pool Number"
          size="lg"
          className="max-w-xs"
          onChange={(e) =>
            handleSelectChange("consumerPoolNumber", Number(e.target.value))
          }
        >
          <SelectItem key={1} value={50}>
            50 (Cut-throat)
          </SelectItem>
          <SelectItem key={2} value={75}>
            75 (Standard)
          </SelectItem>
          <SelectItem key={3} value={100}>
            100 (Friendly Game)
          </SelectItem>
        </Select>
      </div>
    </div>
  );
};

export default GameOptions;
