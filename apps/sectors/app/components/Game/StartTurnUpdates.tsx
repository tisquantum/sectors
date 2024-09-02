import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";

const StartTurnUpdates = () => {
  const { currentTurn, gameId } = useGame();
  const {
    data: companyWithSector,
    isLoading,
    isError,
  } = trpc.company.companyWithSectorFindFirst.useQuery(
    {
      where: {
        gameId,
      },
      orderBy: {
        createdAt: "desc",
      },
    },
    {
      enabled: currentTurn.turn % 3 === 0,
    }
  );
  return (
    <div className="flex flex-col justify-center items-center">
      <h2>Turn {currentTurn.turn}</h2>
      {currentTurn.turn % 3 === 0 && (
        <div className="flex flex-col justify-center items-center">
          <p>
            A new company has opened in {companyWithSector?.Sector.name},
            welcome {companyWithSector?.name}!
          </p>
          <p>Investor Tranches will be distributed.</p>
        </div>
      )}
    </div>
  );
};

export default StartTurnUpdates;
