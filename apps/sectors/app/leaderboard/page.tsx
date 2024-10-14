"use client";

import {
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import { trpc } from "../trpc";
import UserAvatar from "../components/Room/UserAvatar";

export default function Leaderboard() {
  const { data: playerResults, isLoading } =
    trpc.playerResult.groupByUserIdAndSumRankingPoints.useQuery({
      orderBy: {
        rankingPoints: "desc",
      },
    });
  const { data: usersRestricted, isLoading: isLoadingUsersRestricted } =
    trpc.user.listUsersRestricted.useQuery({
      where: {
        id: {
          in: playerResults?.map((playerResult) => playerResult.userId),
        },
      },
    });
  const usersMap = usersRestricted?.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as Record<string, { id: string; name: string }>);
  return (
    <div className="flex flex-col justify-center items-center gap-1 p-2">
      <h1>Leaderboard</h1>
      <div>
        {isLoading || isLoadingUsersRestricted ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableColumn>Rank</TableColumn>
              <TableColumn>Name</TableColumn>
              <TableColumn>Ranking Points</TableColumn>
            </TableHeader>
            <TableBody>
              {playerResults?.map((playerResult, index) => (
                <TableRow key={playerResult.userId}>
                  <TableCell>
                    <span>{index + 1}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 items-center">
                      {usersMap?.[playerResult.userId] && (
                        <UserAvatar
                          user={usersMap[playerResult.userId]}
                          size="sm"
                        />
                      )}
                      <span>{usersMap?.[playerResult.userId]?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{playerResult._sum.rankingPoints}</TableCell>
                </TableRow>
              )) || (
                <TableRow>
                  <TableCell>Loading...</TableCell>
                  <TableCell>Loading...</TableCell>
                  <TableCell>Loading...</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
