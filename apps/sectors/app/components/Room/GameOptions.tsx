import { Input } from '@nextui-org/react';
import { useState } from 'react';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newOptions = {
      ...options,
      [name]: Number(value),
    };
    setOptions(newOptions);
    onOptionsChange && onOptionsChange(newOptions);
  };

  return (
    <div className="p-4 bg-white rounded-t shadow-md">
      <h2 className="text-lg font-bold mb-4 text-sky-400/100">Game Options</h2>
      <div className="mb-4">
        <Input
          id="bankPoolNumber"
          type="number"
          label="Bank Pool"
          placeholder="0.00"
          labelPlacement="inside"
          startContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-small">$</span>
            </div>
          }
        >
            {options.bankPoolNumber}
        </Input>
      </div>
      <div className="mb-4">
        <Input
          id="consumerPoolNumber"
          type="number"
          label="Consumer Pool Number"
          placeholder="0.00"
          labelPlacement="inside"
        >
            {options.consumerPoolNumber}
        </Input>
      </div>
      <div className="mb-4">
        <Input
          id="startingCashOnHand"
          type="number"
          label="Starting Cash On Hand"
          placeholder="0.00"
          labelPlacement="inside"
          startContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-small">$</span>
            </div>
          }
        >
            {options.startingCashOnHand}
        </Input>

      </div>
    </div>
  );
};

export default GameOptions;
