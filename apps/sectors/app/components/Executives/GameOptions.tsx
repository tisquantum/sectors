import { Select, SelectItem } from "@nextui-org/react";
import { GameOptionDescription } from "../Room/GameOptions";
import { tooltipParagraphStyle } from "@sectors/app/helpers/tailwind.helpers";
type ValueMap = {};

type GameOptionsKeys = keyof ValueMap;

const GameOptions = () => {
  return (
    <div className="p-4 rounded-t shadow-md bg-background relative">
      <h2 className="text-lg font-bold mb-4 text-sky-400/100">Game Options</h2>
      <div className="mb-4">No options here.</div>
    </div>
  );
};

export default GameOptions;
