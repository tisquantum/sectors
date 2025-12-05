import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";
import {
  CompanyAction,
  OperatingRoundAction,
} from "@server/prisma/prisma.client";
import CompanyInfo from "./CompanyInfo";
// Prestige imports removed - not used in modern game
import {
  ACTION_ISSUE_SHARE_AMOUNT,
  companyActionsDescription,
} from "@server/data/constants";

const ShareIssue = ({ companyAction }: { companyAction: CompanyAction }) => {
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

  // Prestige rewards query removed - not used in modern game

  if (isLoading || companyLoading) {
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

    const actionName = (
      <h4>
        Action Name:{" "}
        {
          companyActionsDescription.find(
            (description) => description.name == companyAction.action
          )?.title
        }
      </h4>
    );
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
        // Prestige removed - not used in modern game
        actionContent = <div>Prestige action not available in modern game.</div>;
        break;
      case OperatingRoundAction.OUTSOURCE:
        break;
      case OperatingRoundAction.LICENSING_AGREEMENT:
        break;
      case OperatingRoundAction.VETO:
        break;
      default:
        actionContent = <div>Unknown action</div>;
        break;
    }

    return (
      <div>
        {actionName}
        {actionContent}
        {actionDescription}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-col justify-center items-center">
        {companyActions.map((companyAction) => (
          <div
            key={companyAction.id}
            className="w-full mb-6 p-4 border border-gray-300 rounded-lg shadow-md bg-white dark:bg-slate-800 transition-all duration-300 hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {companyAction.action}
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ${companyAction.cost}
              </span>
            </div>
            <div className="border-t border-gray-200 my-2"></div>
            {renderAction(companyAction)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanyVoteResolve;
