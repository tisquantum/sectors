import { trpc } from "@sectors/app/trpc";
import { friendlyAgendaName } from "../helpers";

export const Agendas = ({ playerId }: { playerId: string }) => {
  const {
    data: playerAndAgendas,
    isLoading,
    isError,
    refetch,
  } = trpc.executivePlayer.getExecutivePlayerWithAgendas.useQuery({
    id: playerId,
  });
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;
  if (!playerAndAgendas) return <div>No data</div>;
  return (
    <div className="flex flex-col items-center space-y-4">
      <h1 className="text-2xl font-bold">Agenda</h1>
      {playerAndAgendas.agendas.map((agenda) => (
        <div
          key={agenda.id}
          className="w-80 bg-gradient-to-br from-gray-800 to-gray-600 text-white p-6 rounded-lg shadow-xl border-2 border-yellow-500"
        >
          <h2 className="text-lg font-semibold mb-2 text-yellow-300">
            {friendlyAgendaName(agenda.agendaType)}
          </h2>
          <p className="text-sm italic">{agenda.description}</p>
        </div>
      ))}
    </div>
  );
};
