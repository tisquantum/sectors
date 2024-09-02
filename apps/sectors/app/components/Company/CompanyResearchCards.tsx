import { trpc } from "@sectors/app/trpc";

const CompanyResearchCards = ({ companyId }: { companyId: string }) => {
  const {
    data: researchCards,
    isLoading,
    isError,
  } = trpc.cards.listCards.useQuery({
    where: {
      companyId,
    },
  });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error loading research cards</div>;
  }
  if (!researchCards) {
    return <div>No research cards found</div>;
  }
  return (
    <div className="flex flex-col gap-1">
      {researchCards.map((card) => (
        <div key={card.id} className="p-2 bg-gray-700 rounded-md text-white">
          <h2>{card.name}</h2>
          <p>{card.description}</p>
        </div>
      ))}
    </div>
  );
};

export default CompanyResearchCards;
