import { Input } from "@nextui-org/react";
import Influence from "../Game/Influence";

export const InfluenceMultiInput = ({
  influenceValues,
  setInfluenceValues,
  influences,
}: {
  influenceValues: Record<string, number>;
  setInfluenceValues: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  influences: Record<
    string,
    {
      id: string;
      selfPlayerId: string | null;
      playerId: string;
      count: number;
    }
  >;
}) => {
  console.log("influences", influences);
  if (!influences) {
    return null;
  }
  return (
    <div className="flex flex-col items-center gap-2">
      {Object.keys(influences).map((influenceKey) => (
        <div key={influenceKey} className="flex flex-row items-center gap-2">
          <Influence
            playerId={influences[influenceKey].selfPlayerId || ""}
            influenceCount={influences[influenceKey].count}
          />
          <Input
            type="number"
            value={
              influenceValues[influenceKey]?.toString() || ""
            }
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setInfluenceValues((prev) => ({
                ...prev,
                [influenceKey]: isNaN(value)
                  ? 0
                  : Math.min(value, influences[influenceKey].count),
              }));
            }}
            min={0}
            max={influences[influenceKey].count}
          />
        </div>
      ))}
    </div>
  );
};
