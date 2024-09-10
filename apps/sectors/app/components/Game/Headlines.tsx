import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { HeadlineLocation } from "@server/prisma/prisma.client";

const Headlines = () => {
  const { gameId } = useGame();
  const {
    data: headlines,
    isLoading,
    isError,
  } = trpc.headlines.listHeadlines.useQuery({
    where: {
      gameId,
      headlineLocation: HeadlineLocation.FOR_SALE,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return (
    <div>
      <h2>Headlines</h2>
      <p>
        The following headlines are being pushed.
      </p>
    </div>
  );
};

export default Headlines;
