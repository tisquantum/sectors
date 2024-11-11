import { trpc } from "@sectors/app/trpc";
import { useExecutiveGame } from "./GameContext";
import { Tricks } from "./Tricks";

export const TrickHistory = ({ gameId }: { gameId: string }) => {
  const {
    data: gameTurns,
    isLoading,
    isError,
  } = trpc.executiveGameTurn.listExecutiveGameTurns.useQuery({
    where: {
      gameId,
    },
  });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error...</div>;
  }
  if (!gameTurns) {
    return <div>No game turns found</div>;
  }
  if (gameTurns.length === 0) {
    return <div>No game turns found</div>;
  }
  return (
    <div className="p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-bold mb-4">Trick History</h2>
      <div className="space-y-6">
        {gameTurns.map((turn, index) => (
          <div
            key={index}
            className="p-4 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="font-semibold text-gray-400 mb-2">
              Turn {index + 1}
            </div>
            <div className="border-t border-gray-300 pt-4">
              <Tricks gameTurn={turn} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
