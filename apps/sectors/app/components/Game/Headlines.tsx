import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { HeadlineLocation } from "@server/prisma/prisma.client";
import { RiMoneyDollarBoxFill } from "@remixicon/react";
import { HeadlineWithRelations } from "@server/prisma/prisma.types";
import CompanyComponent from "../Company/Company";
const HeadlineComponent = ({headline}: {headline: HeadlineWithRelations}) => (
  <div>
    <div>{headline.title}</div>
    <div>{headline.description}</div>
    <div><RiMoneyDollarBoxFill />{headline.cost}</div>
    {headline.company && <CompanyComponent company={headline.company} />}
  </div>
)

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
      {isLoading && <div>Loading...</div>}
      {isError && <div>Error loading headlines</div>}
      {headlines?.map((headline) => (
        <div key={headline.id}>
          <HeadlineComponent headline={headline} />
        </div>
      ))}
    </div>
  );
};

export default Headlines;
