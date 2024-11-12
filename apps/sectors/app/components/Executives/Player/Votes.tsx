import { trpc } from "@sectors/app/trpc";
import PlayerAvatar from "./PlayerAvatar";
import { Avatar } from "@nextui-org/react";
import { PlayerAvatarById } from "./PlayerAvatarById";

export const Votes = ({ gameId }: { gameId: string }) => {
  const {
    data: votes,
    isLoading,
    isError,
  } = trpc.executiveVoteMarker.listExecutiveVoteMarkers.useQuery({
    where: {
      gameId,
    },
  });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error</div>;
  }
  if (!votes) {
    return <div>No votes found</div>;
  }
  if (votes.length === 0) {
    return <div>No votes found</div>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1">
      {votes.map((vote) => (
        <div key={vote.id} className="flex items-center">
          {vote.isCeo ? (
            <Avatar name="CEO" size="sm" />
          ) : vote.votedPlayer ? (
            <PlayerAvatar player={vote.votedPlayer} size="sm" />
          ) : null}
        </div>
      ))}
    </div>
  );
};
