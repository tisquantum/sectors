import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";
import { CompanyAction, OperatingRoundAction } from "@server/prisma/prisma.client";

const ShareIssue = ({ companyAction }: {companyAction: CompanyAction}) => {
    const { authPlayer } = useGame();
    //get company with shares
    const { data: company, isLoading } = trpc.company.getCompanyWithShares.useQuery({
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
}

const CompanyVoteResolve = () => {
  const { currentPhase } = useGame();
  console.log("currentPhase", currentPhase);
  const { data: companyAction, isLoading } =
    trpc.companyAction.getCompanyAction.useQuery({
      operatingRoundId: currentPhase?.operatingRoundId || 0,
      companyId: currentPhase?.companyId || '',
    });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!companyAction) {
    return <div>No company actions found</div>;
  }

  const renderAction = () => {
    switch (companyAction.action) {
        case OperatingRoundAction.MARKETING:
            return <div>Marketing</div>;
        case OperatingRoundAction.RESEARCH:
            return <div>Research</div>;
        case OperatingRoundAction.EXPANSION:
            return <div>Expansion</div>;
        case OperatingRoundAction.DOWNSIZE:
            return <div>Downsize</div>;
        case OperatingRoundAction.MERGE:
            return <div>Merge</div>;
        case OperatingRoundAction.SHARE_BUYBACK:
            return <div>Share Buyback</div>;
        case OperatingRoundAction.SHARE_ISSUE:
            return <div>
                <span>Share Issue</span>
                <ShareIssue companyAction={companyAction} /></div>;
        default:
            return <div>Unknown action</div>;
    }
  };
  return <div>{renderAction()}</div>;
};

export default CompanyVoteResolve;
