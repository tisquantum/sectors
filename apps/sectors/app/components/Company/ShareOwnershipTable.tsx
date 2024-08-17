import {
  AvatarGroup,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import { CompanyWithRelations } from "@server/prisma/prisma.types";
import { useGame } from "../Game/GameContext";
import { trpc } from "@sectors/app/trpc";
import { useEffect } from "react";
import PlayerAvatar from "../Player/PlayerAvatar";
import { Share } from "next/font/google";
import ShareComponent from "./Share";

const ShareOwnershipTable = ({
  company,
}: {
  company: CompanyWithRelations;
}) => {
  const { gameId, currentPhase } = useGame();
  //get players with shares for game for company id
  const {
    data: playersWithShares,
    isLoading,
    isError,
    refetch,
  } = trpc.player.playersWithShares.useQuery({
    where: { gameId },
  });
  useEffect(() => {
    refetch();
  }, [currentPhase?.id]);
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading players with shares</div>;
  if (!playersWithShares) return <div>No players with shares</div>;
  console.log("playersWithShares", playersWithShares);
  //   return (
  //     <Table>
  //       <TableHeader>
  //         <TableColumn>Player</TableColumn>
  //         <TableColumn>Shares</TableColumn>
  //         <TableColumn>Ownership %</TableColumn>
  //       </TableHeader>
  //       <TableBody>
  //         {playersWithShares.map((playerWithShare) => {
  //           const playerSharesForCompany = playerWithShare.Share.filter(
  //             (share) => share.companyId === company.id
  //           );
  //           return (
  //             <TableRow key={playerWithShare.id}>
  //               <TableCell>
  //                 <PlayerAvatar player={playerWithShare} />{" "}
  //               </TableCell>
  //               <TableCell>{playerSharesForCompany.length}</TableCell>
  //               <TableCell>
  //                 %{playerSharesForCompany.length / company.Share.length}
  //               </TableCell>
  //             </TableRow>
  //           );
  //         })}
  //       </TableBody>
  //     </Table>
  //   );
  const calculateWidthForLength = (length: number) => {
    switch (length) {
      case 0:
        return "w-auto";
      case 1:
        return "w-20";
      case 2:
        return "w-24";
      case 3:
        return "w-36";
      case 4:
        return "w-48";
      case 5:
        return "w-52";
      default:
        return "w-44";
    }
  };
  const playersWithSharesAboveZero = playersWithShares.filter(
    (player) =>
      player.Share.filter((share) => share.companyId === company.id).length > 0
  );
  console.log("playersWithSharesAboveZero", playersWithSharesAboveZero.length);
  return (
    <div
      className={`relative flex flex-wrap gap-2 ${calculateWidthForLength(
        playersWithSharesAboveZero.length
      )}`}
    >
      {playersWithSharesAboveZero.map((playerWithShare) => {
        const playerSharesForCompany = playerWithShare.Share.filter(
          (share) => share.companyId === company.id
        );
        return (
          <div key={playerWithShare.id} className="flex items-center gap-2">
            <Badge color="primary" content={playerSharesForCompany.length}>
              <PlayerAvatar player={playerWithShare} />
            </Badge>
          </div>
        );
      })}
    </div>
  );
};

export default ShareOwnershipTable;
