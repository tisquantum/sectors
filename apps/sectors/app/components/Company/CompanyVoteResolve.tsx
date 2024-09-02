import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";
import {
  CompanyAction,
  OperatingRoundAction,
} from "@server/prisma/prisma.client";
import CompanyInfo from "./CompanyInfo";
import PrestigeRewardComponent from "../Game/PrestigeReward";
import {
  ACTION_ISSUE_SHARE_AMOUNT,
  companyActionsDescription,
  LARGE_MARKETING_CAMPAIGN_DEMAND,
  MARKETING_CONSUMER_BONUS,
  OURSOURCE_SUPPLY_BONUS,
  PrestigeTrack,
  SMALL_MARKETING_CAMPAIGN_DEMAND,
} from "@server/data/constants";
import PrestigeRewards from "../Game/PrestigeRewards";

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
      <span>
        Previous Share Count: {company.Share.length - ACTION_ISSUE_SHARE_AMOUNT}
      </span>
      <span>New Share Count: {company.Share.length}</span>
    </div>
  );
};

const CompanyVoteResolve = () => {
  const { currentPhase, currentTurn } = useGame();

  const { data: companyActions, isLoading } =
    trpc.companyAction.listCompanyActions.useQuery({
      where: {
        operatingRoundId: currentPhase?.operatingRoundId || 0,
        companyId: currentPhase?.companyId || "",
      },
    });

  const { data: company, isLoading: companyLoading } =
    trpc.company.getCompanyWithRelations.useQuery({
      id: currentPhase?.companyId || "",
    });

  const { data: prestigeRewards, isLoading: prestigeRewardsLoading } =
    trpc.prestigeReward.listPrestigeRewards.useQuery({
      where: {
        gameTurnId: currentTurn?.id || "",
        companyId: currentPhase?.companyId || "",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  if (isLoading || companyLoading || prestigeRewardsLoading) {
    return <div>Loading...</div>;
  }

  if (!companyActions?.length) {
    return <div>No company actions found</div>;
  }

  if (!company) {
    return <div>No company found</div>;
  }

  const renderAction = (companyAction: CompanyAction) => {
    const researchCardDrawn =
      companyAction.action === OperatingRoundAction.RESEARCH
        ? company.Cards.sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
          )[0]
        : null;

    const costDiv = <span>Action Cost: ${companyAction.cost}</span>;
    const actionDescription = (
      <p>
        {
          companyActionsDescription.find(
            (description) => description.name === companyAction.action
          )?.message
        }
      </p>
    );
    let actionContent;

    switch (companyAction.action) {
      case OperatingRoundAction.MARKETING:
        break;
      case OperatingRoundAction.MARKETING_SMALL_CAMPAIGN:
        break;
      case OperatingRoundAction.RESEARCH:
        actionContent = (
          <div>
            <h1>Research</h1>
            <div>You drew a research card.</div>
            <div className="flex flex-col bg-slate-800 rounded-md p-6 border border-blue-800">
              <span>{researchCardDrawn?.name}</span>
              <span>{researchCardDrawn?.description}</span>
            </div>
          </div>
        );
        break;
      case OperatingRoundAction.EXPANSION:
        actionContent = <div>Expansion</div>;
        break;
      case OperatingRoundAction.DOWNSIZE:
        actionContent = <div>Downsize</div>;
        break;
      case OperatingRoundAction.MERGE:
        actionContent = <div>Merge</div>;
        break;
      case OperatingRoundAction.SHARE_BUYBACK:
        actionContent = <div>Share Buyback</div>;
        break;
      case OperatingRoundAction.SHARE_ISSUE:
        actionContent = (
          <div>
            <span>Share Issue</span>
            <ShareIssue companyAction={companyAction} />
          </div>
        );
        break;
      case OperatingRoundAction.INCREASE_PRICE:
        actionContent = <div>Increase Price</div>;
        break;
      case OperatingRoundAction.DECREASE_PRICE:
        actionContent = <div>Decrease Price</div>;
        break;
      case OperatingRoundAction.LOAN:
        actionContent = <div>Loan</div>;
        break;
      case OperatingRoundAction.LOBBY:
        actionContent = <div>Lobby</div>;
        break;
      case OperatingRoundAction.SPEND_PRESTIGE:
        actionContent = (
          <div>
            <span>Spent Prestige and received a reward.</span>
            <div>
              {prestigeRewards?.map((reward) => (
                <div key={reward.id}>
                  <PrestigeRewardComponent prestigeReward={reward} />
                </div>
              ))}
            </div>
            <PrestigeRewards />
          </div>
        );
        break;
      case OperatingRoundAction.OUTSOURCE:
        break;
      case OperatingRoundAction.VETO:
        break;
      default:
        actionContent = <div>Unknown action</div>;
        break;
    }

    return (
      <div>
        {actionContent}
        {actionDescription}
        {costDiv}
      </div>
    );
  };

  return (
    <div>
      <CompanyInfo company={company} showBarChart />
      <div className="border-b-2 border-gray-200 my-4"></div>
      {companyActions.map((companyAction) => (
        <div key={companyAction.id} className="mb-4">
          {renderAction(companyAction)}
        </div>
      ))}
    </div>
  );
};

export default CompanyVoteResolve;
