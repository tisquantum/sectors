import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";
import {
  CompanyAction,
  OperatingRoundAction,
} from "@server/prisma/prisma.client";
import CompanyInfo from "./CompanyInfo";
import PrestigeRewardComponent from "../Game/PrestigeReward";
import {
  MARKETING_CONSUMER_BONUS,
  PrestigeTrack,
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
      <span>Previous Share Count: {company.Share.length - 1}</span>
      <span>New Share Count: {company.Share.length}</span>
    </div>
  );
};

const CompanyVoteResolve = () => {
  const { currentPhase, currentTurn } = useGame();
  const { data: companyAction, isLoading } =
    trpc.companyAction.getCompanyAction.useQuery({
      operatingRoundId: currentPhase?.operatingRoundId || 0,
      companyId: currentPhase?.companyId || "",
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
  if (prestigeRewardsLoading) {
    return <div>Loading...</div>;
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
            <span>Large Marketing Campaign</span>
            <div>
              <p>
                The sector receives {MARKETING_CONSUMER_BONUS} additional
                consumers. Your company receives +3 demand that decays 1 per
                production phase.
              </p>
            </div>
          </div>
        );
      case OperatingRoundAction.MARKETING_SMALL_CAMPAIGN:
        return (
          <div>
            <span>Small Marketing Campaign</span>
            <div>
              <p>
                The company receives +2 demand that decays 1 per production
                phase.
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
      case OperatingRoundAction.LOAN:
        return <div>Loan</div>;
      case OperatingRoundAction.LOBBY:
        return <div>Lobby</div>;
      case OperatingRoundAction.SPEND_PRESTIGE:
        return (
          <div>
            <span>Spent Prestige and received a reward.</span>
            <div>
              {prestigeRewards?.map((reward) => (
                <div key={reward.id}>
                  <PrestigeRewardComponent prestigeReward={reward} />
                </div>
              ))}
            </div>
          </div>
        );
      case OperatingRoundAction.VETO:
        return <div>Action vetoed.</div>;
      default:
        return <div>Unknown action</div>;
    }
  };
  return (
    <div>
      <CompanyInfo company={company} showBarChart />
      <div className="border-b-2 border-gray-200 my-4"></div>
      {renderAction()}
    </div>
  );
};

export default CompanyVoteResolve;
