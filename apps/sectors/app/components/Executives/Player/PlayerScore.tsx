import { TableCell, TableRow } from "@nextui-org/react";
import {
  ExecutivePlayer,
  ExecutiveVictoryPoint,
  VictoryPointType,
} from "@server/prisma/prisma.client";
import PlayerAvatar from "./PlayerAvatar";

export const PlayerScoreTypeSortingOrder = [
  VictoryPointType.GIFT,
  VictoryPointType.VOTE,
  VictoryPointType.RELATIONSHIP,
  VictoryPointType.AGENDA,
];

export const PlayerScore = ({
  player,
  playerScores,
}: {
  player: ExecutivePlayer;
  playerScores: ExecutiveVictoryPoint[];
}) => {
  // Group the scores by type
  const groupVictoryPointsByType = (playerScores: ExecutiveVictoryPoint[]) => {
    return playerScores.reduce((acc, playerScore) => {
      acc[playerScore.victoryPointType] =
        (acc[playerScore.victoryPointType] || 0) + playerScore.victoryPoint;
      return acc;
    }, {} as Record<VictoryPointType, number>);
  };

  const groupedScores = groupVictoryPointsByType(playerScores);
  // Calculate the total score
  const totalScore = PlayerScoreTypeSortingOrder.reduce(
    (total, type) => total + (groupedScores[type] || 0),
    0
  );
  return (
    <>
      <TableRow>
        <TableCell>
          <PlayerAvatar player={player} />
        </TableCell>
        {/* Victory Point Type Cells */}
        <TableCell>
          <span>{groupedScores[VictoryPointType.GIFT] || 0}</span>
        </TableCell>
        <TableCell>
          <span>{groupedScores[VictoryPointType.VOTE] || 0}</span>
        </TableCell>
        <TableCell>
          <span>{groupedScores[VictoryPointType.RELATIONSHIP] || 0}</span>
        </TableCell>
        <TableCell>
          <span>{groupedScores[VictoryPointType.AGENDA] || 0}</span>
        </TableCell>
        {/* Total Score Cell */}
        <TableCell>
          <strong>{totalScore}</strong>
        </TableCell>
      </TableRow>
    </>
  );
};
