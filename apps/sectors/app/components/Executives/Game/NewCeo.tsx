import { trpc } from "@sectors/app/trpc";
import { motion } from "framer-motion";
import { Avatar, AvatarGroup } from "@nextui-org/react";
import PlayerAvatar from "../Player/PlayerAvatar";

const NewCeo = ({ gameId }: { gameId: string }) => {
  const { data: players, error } =
    trpc.executivePlayer.listExecutivePlayers.useQuery({
      where: { gameId },
    });

  if (error) {
    return <div>Error loading players</div>;
  }

  if (!players) {
    return <div>Loading players...</div>;
  }

  // Calculate vote results
  const voteResults = players.reduce((acc: Record<string, number>, player) => {
    // Count votes from voteMarkerVoted
    player.voteMarkerVoted.forEach((voteMarker) => {
      if (voteMarker.isCeo) {
        acc["FOREIGN_INVESTOR"] = (acc["FOREIGN_INVESTOR"] || 0) + 1;
      } else if (voteMarker.votedPlayerId) {
        acc[voteMarker.votedPlayerId] =
          (acc[voteMarker.votedPlayerId] || 0) + 1;
      }
    });

    // Add a self-vote for each player
    acc[player.id] = (acc[player.id] || 0) + 1;

    return acc;
  }, {});

  // Determine the voted CEO(s)
  const votedCeo = Object.entries(voteResults).reduce(
    (acc: { playerIds: string[]; count: number }, [playerId, count]) => {
      if (count > acc.count) {
        return { playerIds: [playerId], count };
      } else if (count === acc.count) {
        acc.playerIds.push(playerId);
      }
      return acc;
    },
    { playerIds: [], count: 0 }
  );

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative p-4 rounded-lg shadow-lg bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 border-4 border-yellow-400"
    >
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center text-white text-2xl font-bold mb-4"
      >
        CEO
      </motion.h1>
      <AvatarGroup>
        {votedCeo.playerIds.map((playerId) => {
          const player = players.find((p) => p.id === playerId);
          return player ? (
            <PlayerAvatar key={playerId} player={player} />
          ) : (
            <Avatar key={playerId} name="FI" />
          );
        })}
      </AvatarGroup>
    </motion.div>
  );
};

export default NewCeo;
