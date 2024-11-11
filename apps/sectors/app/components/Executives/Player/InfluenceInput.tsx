import { Input } from "@nextui-org/react";

export const InfluenceInput = ({
  influenceValue,
  setInfluenceValue,
  influenceMin,
  influenceMax,
  title = "Bid Influence",
}: {
  influenceValue: string;
  setInfluenceValue: (value: number) => void;
  influenceMin: number;
  influenceMax: number;
  title?: string;
}) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <span>{title}</span>
      <Input
        type="number"
        value={influenceValue}
        onChange={(e) => setInfluenceValue(parseFloat(e.target.value))}
        min={influenceMin}
        max={influenceMax}
      />
    </div>
  );
};
