import { sectorPriority } from "@server/data/constants";
import SectorAvatarComponent from "../Sector/SectorAvatarComponent";
import { useGame } from "./GameContext";

const SectorPriority = () => {
  const { gameState } = useGame();
  if (!gameState.sectorPriority || gameState.sectorPriority.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-4">
      {gameState.sectorPriority
        .sort((a, b) => a.priority - b.priority)
        .map((sector, index) => (
          <div
            key={index}
            className="flex items-center bg-slate-800 shadow rounded-lg p-4 w-full sm:w-auto"
          >
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 font-bold mr-4">
              {sector.priority}
            </div>
            <div className="flex flex-col">
              <SectorAvatarComponent sectorId={sector.sectorId} />
            </div>
          </div>
        ))}
    </div>
  );
};

export default SectorPriority;
