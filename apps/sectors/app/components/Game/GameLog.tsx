import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";

const GameLog = () => {
  const { gameId } = useGame();
  const {
    data: gameLog,
    isLoading,
    error,
  } = trpc.gameLog.listGameLogs.useQuery({
    where: {
      gameId,
    },
    orderBy: {
      id: "desc",
    },
  });
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!gameLog) return <div>No game log found</div>;
  return (
    <div className="flex flex-col gap-4 overflow-auto h-96 p-4 rounded-lg shadow-md">
      {gameLog.map((log) => (
        <div
          key={log.id}
          className="flex flex-col bg-slate-800 p-4 rounded-md shadow-sm"
        >
          <span className="text-gray-200 font-medium">{log.content}</span>
          <span className="text-slate-100 text-sm">
            {new Date(log.createdAt).toLocaleTimeString()}
          </span>
        </div>
      ))}
    </div>
  );
};
export default GameLog;
