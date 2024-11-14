import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import { useExecutiveGame } from "./GameContext";
import {
  PlayerScore,
  PlayerScoreTypeSortingOrder,
} from "../Player/PlayerScore";
import {
  ExecutiveVictoryPoint,
  VictoryPointType,
} from "@server/prisma/prisma.client";
import PlayerAvatar from "../Player/PlayerAvatar";

const GameResults = () => {
  const { gameState } = useExecutiveGame();
  const { players, ExecutiveVictoryPoint: executiveVictoryPoints } = gameState;

  // Group victory points by player
  const playerScoresMap = players.reduce((acc, player) => {
    acc[player.id] = executiveVictoryPoints.filter(
      (vp) => vp.playerId === player.id
    );
    return acc;
  }, {} as Record<string, ExecutiveVictoryPoint[]>);

  return (
    <Table aria-label="Game Results Table">
      <TableHeader>
        <TableColumn>Player</TableColumn>

        {/* Victory Point Type Columns */}
        <TableColumn>Gift</TableColumn>
        <TableColumn>Vote</TableColumn>
        <TableColumn>Relationship</TableColumn>
        <TableColumn>Agenda</TableColumn>

        {/* Total Score Column */}
        <TableColumn>Total</TableColumn>
      </TableHeader>

      <TableBody>
        {players.map((player) => {
          // Group the scores by type
          const groupVictoryPointsByType = (
            playerScores: ExecutiveVictoryPoint[]
          ) => {
            return playerScores.reduce((acc, playerScore) => {
              acc[playerScore.victoryPointType] =
                (acc[playerScore.victoryPointType] || 0) +
                playerScore.victoryPoint;
              return acc;
            }, {} as Record<VictoryPointType, number>);
          };

          const groupedScores = groupVictoryPointsByType(
            playerScoresMap[player.id]
          );
          // Calculate the total score
          const totalScore = PlayerScoreTypeSortingOrder.reduce(
            (total, type) => total + (groupedScores[type] || 0),
            0
          );
          return (
            <TableRow key={player.id}>
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
          );
        })}
      </TableBody>
    </Table>
  );
};

export const GameResultsOverview = ({
  isOpen,
  onOpen,
  onClose,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onOpenChange: (isOpen: boolean) => void;
}) => {
  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="full"
        className="h-5/6 dark bg-slate-900 text-foreground"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="container mx-auto px-4">
                  <h1 className="text-xl lg:text-3xl font-bold">
                    Game Results
                  </h1>
                </div>
              </ModalHeader>
              <ModalBody className="overflow-y-scroll scrollbar">
                <GameResults />
              </ModalBody>
              <ModalFooter>
                <Button
                  color="primary"
                  className="text-lg lg:text-2xl"
                  variant="light"
                  onPress={onClose}
                >
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
