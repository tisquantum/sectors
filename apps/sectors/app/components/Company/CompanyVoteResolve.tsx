import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";
import {
  CompanyAction,
  OperatingRoundAction,
} from "@server/prisma/prisma.client";

const ShareIssue = ({ companyAction }: { companyAction: CompanyAction }) => {
  const { authPlayer } = useGame();
  //get company with shares
  const { data: company, isLoading } =
    trpc.company.getCompanyWithShares.useQuery({
      id: companyAction.companyId,
    });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!company) {
    return <div>No company found</div>;
  }
  return (
    <div className="flex flex-col">
      <span>Previous Share Count: {company.Share.length - 1}</span>
      <span>New Share Count: {company.Share.length}</span>
    </div>
  );
};

const CompanyVoteResolve = () => {
  const { currentPhase } = useGame();
  const { data: companyAction, isLoading } =
    trpc.companyAction.getCompanyAction.useQuery({
      operatingRoundId: currentPhase?.operatingRoundId || 0,
      companyId: currentPhase?.companyId || "",
    });
  const { data: company, isLoading: companyLoading } =
    trpc.company.getCompanyWithCards.useQuery({
      id: currentPhase?.companyId || "",
    });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!companyAction) {
    return <div>No company actions found</div>;
  }

  if (companyLoading) {
    return <div>Loading...</div>;
  }
  if (!company) {
    return <div>No company found</div>;
  }
  const researchCardDrawn =
    companyAction.action === OperatingRoundAction.RESEARCH
      ? company.Cards.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        )[0]
      : null;

  const renderAction = () => {
    switch (companyAction.action) {
      case OperatingRoundAction.MARKETING:
        return (
          <div>
            <span>Marketing</span>
            <div>
              <p>
                The sector will receive 5 consumers at the end of the turn. Your
                company receives +3 demand that decays 1 per production phase.
              </p>
            </div>
          </div>
        );
      case OperatingRoundAction.RESEARCH:
        return (
          <div>
            <h1>Research</h1>
            <div>You drew a research card.</div>
            <div className="flex flex-col bg-slate-800 rounded-md p-6 border border-blue-800">
              <span>{researchCardDrawn?.name}</span>
              <span>{researchCardDrawn?.description}</span>
            </div>
          </div>
        );
      case OperatingRoundAction.EXPANSION:
        return <div>Expansion</div>;
      case OperatingRoundAction.DOWNSIZE:
        return <div>Downsize</div>;
      case OperatingRoundAction.MERGE:
        return <div>Merge</div>;
      case OperatingRoundAction.SHARE_BUYBACK:
        return <div>Share Buyback</div>;
      case OperatingRoundAction.SHARE_ISSUE:
        return (
          <div>
            <span>Share Issue</span>
            <ShareIssue companyAction={companyAction} />
          </div>
        );
      case OperatingRoundAction.INCREASE_PRICE:
        return <div>Increase Price</div>;
      case OperatingRoundAction.DECREASE_PRICE:
        return <div>Decrease Price</div>;
      default:
        return <div>Unknown action</div>;
    }
  };
  return (
    <div>
      {companyAction.Company.name}
      {renderAction()}
    </div>
  );
};

export default CompanyVoteResolve;
