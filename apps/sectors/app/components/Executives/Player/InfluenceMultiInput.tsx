import { Input } from "@nextui-org/react";
import Influence from "../Game/Influence";
import { useEffect, useMemo } from "react";

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
  
  // Memoize influence keys to use as stable dependency
  const influenceKeys = useMemo(() => {
    return Object.keys(influences || {}).sort().join(',');
  }, [influences]);
  
  // Initialize all influence values to 1 if they're not set or are 0
  useEffect(() => {
    if (influences) {
      const initialized: Record<string, number> = {};
      let needsUpdate = false;
      
      Object.keys(influences).forEach((influenceKey) => {
        const currentValue = influenceValues[influenceKey];
        if (currentValue === undefined || currentValue === 0) {
          initialized[influenceKey] = 1;
          needsUpdate = true;
        }
      });
      
      if (needsUpdate) {
        setInfluenceValues((prev) => ({ ...prev, ...initialized }));
      }
    }
    // Only depend on influence keys, not influenceValues to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [influenceKeys]);
  
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
              (influenceValues[influenceKey] || 1).toString()
            }
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              // Prevent 0 or negative values, default to 1
              const clampedValue = isNaN(value) || value <= 0
                ? 1
                : Math.min(value, influences[influenceKey].count);
              setInfluenceValues((prev) => ({
                ...prev,
                [influenceKey]: clampedValue,
              }));
            }}
            min={1}
            max={influences[influenceKey].count}
          />
        </div>
      ))}
    </div>
  );
};
