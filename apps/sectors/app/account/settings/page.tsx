"use client";
import { useAuthUser } from "../../components/AuthUser.context";
import UpdateName from "../../components/General/UpdateName";
import UserAvatar from "../../components/Room/UserAvatar";
import { trpc } from "../../trpc";

export default function Settings() {
  const { user } = useAuthUser();
  const { data: playerResults } = trpc.playerResult.listPlayerResults.useQuery({
    where: {
      userId: user?.id,
    },
  });
  let rankingPoints;
  if (playerResults) {
    rankingPoints = playerResults.reduce((acc, playerResult) => {
      return acc + playerResult.rankingPoints;
    }, 0);
  }
  return (
    <div className="p-2 flex-col justify-center items-center content-center gap-2 w-full">
      <div className="flex flex-col justify-center items-center gap-2">
        <h1 className="text-2xl">Settings</h1>
        <div className="flex gap-2 justify-center items-center">
          {user && (
            <div className="flex flex-col gap-1">
              <UserAvatar user={user} size="lg" showNameLabel />
              <div className="flex flex-col gap-1">
                <div>Ranking Points: {rankingPoints}</div>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <UpdateName />
          </div>
        </div>
      </div>
    </div>
  );
}
