import {
  Avatar,
  Chip,
  Select,
  SelectionMode,
  SelectItem,
} from "@nextui-org/react";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { notFound } from "next/navigation";
import { ChangeEventHandler } from "react";
import PlayerAvatar from "../Player/PlayerAvatar";

const PlayerSelect = ({
  onChange,
  selectionMode,
}: {
  onChange: ChangeEventHandler<HTMLSelectElement>;
  selectionMode?: SelectionMode;
}) => {
  const { gameId } = useGame();
  const { data: players, isLoading } = trpc.player.listPlayers.useQuery({
    where: { gameId },
  });

  if (isLoading) return null;
  if (players == undefined) return notFound();

  return (
    <Select
      items={players}
      label="Users"
      variant="bordered"
      isMultiline={true}
      selectionMode={selectionMode || "multiple"}
      placeholder="Select a user"
      labelPlacement="outside"
      classNames={{
        base: "max-w-xs",
        trigger: "min-h-12 py-2",
      }}
      popoverProps={{
        className: "pointer-events-auto",
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
      onChange={onChange}
    >
      {(player) => (
        <SelectItem key={player.id} textValue={player.nickname}>
          <div className="flex gap-2 items-center">
            <PlayerAvatar player={player} />
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
