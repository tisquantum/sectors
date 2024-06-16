import { Avatar, Chip, Select, SelectItem } from "@nextui-org/react";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { notFound } from "next/navigation";

const PlayerSelect = () => {
  const { gameId } = useGame();
  const { data: players, isLoading } = trpc.player.listPlayers.useQuery({ where: { gameId } });
  
  if(isLoading) return null;
  if(players == undefined) return notFound();

  return (
    <Select
      items={players}
      label="Assigned to"
      variant="bordered"
      isMultiline={true}
      selectionMode="multiple"
      placeholder="Select a user"
      labelPlacement="outside"
      classNames={{
        base: "max-w-xs",
        trigger: "min-h-12 py-2",
      }}
      renderValue={(items) => {
        return (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <Chip key={item.key}>{item.data?.nickname}</Chip>
            ))}
          </div>
        );
      }}
    >
      {(player) => (
        <SelectItem key={player.id} textValue={player.nickname}>
          <div className="flex gap-2 items-center">
            <Avatar
              alt={player.nickname}
              className="flex-shrink-0"
              size="sm"
            />
            <div className="flex flex-col">
              <span className="text-small">{player.nickname}</span>
            </div>
          </div>
        </SelectItem>
      )}
    </Select>
  );
};

export default PlayerSelect;
