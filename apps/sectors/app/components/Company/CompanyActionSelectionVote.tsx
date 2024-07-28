import {
  Avatar,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "@nextui-org/react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import CompanyActionVote from "./CompanyActionVote";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";
import {
  CompanyActionCosts,
  DEFAULT_DECREASE_UNIT_PRICE,
  DEFAULT_INCREASE_UNIT_PRICE,
  getCompanyOperatingRoundTurnOrder,
  LOAN_AMOUNT,
  LOAN_INTEREST_RATE,
  MARKETING_CONSUMER_BONUS,
  PRESTIGE_ACTION_TOKEN_COST,
} from "@server/data/constants";
import {
  Company,
  CompanyAction,
  CompanyStatus,
  OperatingRoundAction,
  PhaseName,
} from "@server/prisma/prisma.client";
import {
  CompanyWithSector,
  OperatingRoundVoteWithPlayer,
} from "@server/prisma/prisma.types";
import ShareHolders from "./ShareHolders";
import { sectorColors } from "@server/data/gameData";
import PlayerAvatar from "../Player/PlayerAvatar";
import CompanyInfo from "./CompanyInfo";
import PrestigeRewards from "../Game/PrestigeRewards";
import Button from "@sectors/app/components/General/DebounceButton";
import DebounceButton from "@sectors/app/components/General/DebounceButton";

const companyActions = [
  {
    id: 1,
    title: "Large Marketing Campaign",
    name: OperatingRoundAction.MARKETING,
    message: `The sector receives an additional ${MARKETING_CONSUMER_BONUS} consumers. Your company receives +3 demand that decays 1 per production phase.`,
  },
  {
    id: 2,
    title: "Small Marketing Campaign",
    name: OperatingRoundAction.MARKETING_SMALL_CAMPAIGN,
    message: `The company receives +2 demand that decays 1 per production phase.`,
  },
  {
    id: 3,
    title: "Research",
    name: OperatingRoundAction.RESEARCH,
    message:
      "Invest in research to gain a competitive edge. Draw one card from the research deck.",
  },
  {
    id: 4,
    title: "Expansion",
    name: OperatingRoundAction.EXPANSION,
    message:
      "Increase company size (base operational costs per OR) to meet higher demand and increase supply.",
  },
  {
    id: 5,
    title: "Downsize",
    name: OperatingRoundAction.DOWNSIZE,
    message:
      "Reduce company size (base operational costs per OR) to lower operation costs and decrease supply.",
  },
  {
    id: 6,
    title: "Share Buyback",
    name: OperatingRoundAction.SHARE_BUYBACK,
    message:
      "Buy back a share from the open market. This share is taken out of rotation from the game.",
  },
  {
    id: 7,
    title: "Share Issue",
    name: OperatingRoundAction.SHARE_ISSUE,
    message: "Issue a share to the open market.",
  },
  {
    id: 8,
    title: "Increase Unit Price",
    name: OperatingRoundAction.INCREASE_PRICE,
    message: `Increase the unit price of the company's product by ${DEFAULT_INCREASE_UNIT_PRICE}. This will increase the company's revenue. Be careful as consumers choose the company with the cheapest product in the sector first!`,
  },
  {
    id: 9,
    title: "Decrease Unit Price",
    name: OperatingRoundAction.DECREASE_PRICE,
    message: `Decrease the unit price of the company's product by ${DEFAULT_DECREASE_UNIT_PRICE}. This will decrease the company's revenue.`,
  },
  {
    id: 10,
    title: "Spend Prestige",
    name: OperatingRoundAction.SPEND_PRESTIGE,
    message: `Purchase the current prestige track item at it's cost to receive the reward on the prestige track and move it forward by 1. If the company does not have enough prestige, move the prestige track forward by 1.`,
  },
  {
    id: 11,
    title: "Loan",
    name: OperatingRoundAction.LOAN,
    message: `Take out a loan of $${LOAN_AMOUNT} to increase cash on hand. Be careful, loans must be paid back with interest @ %${LOAN_INTEREST_RATE} per turn. This action can only be taken once per game.`,
  },
  {
    id: 12,
    title: "Lobby",
    name: OperatingRoundAction.LOBBY,
    message: `Lobby the government to force demand in your favor. Boost the entire sectors demand by 1 for the next operating round.`,
  },
  {
    id: 13,
    title: "Veto",
    name: OperatingRoundAction.VETO,
    message:
      "The company does nothing this turn. Pick this to ensure the company will not act on any other proposal.",
  },
];
const CompanyActionSelectionVote = ({
  company,
  actionVoteResults,
  companyAction,
  withResult,
}: {
  company?: CompanyWithSector;
  actionVoteResults?: OperatingRoundVoteWithPlayer[];
  withResult?: boolean;
  companyAction?: CompanyAction;
}) => {
  const { currentPhase, authPlayer, gameId } = useGame();
  const [submitComplete, setSubmitComplete] = useState(false);
  const [selectedAction, setSelectedAction] = useState<OperatingRoundAction>();
  const createOperatingRoundVote =
    trpc.operatingRoundVote.createOperatingRoundVote.useMutation();
  if (!company) return <div>No company found</div>;
  const checkIfDisabled = (actionName: OperatingRoundAction) => {
    if (CompanyActionCosts[actionName] > company.cashOnHand) {
      return true;
    }
    if (actionName == OperatingRoundAction.LOAN && company.hasLoan) {
      return true;
    }
  };
  const handleSelected = (action: OperatingRoundAction, companyId: string) => {
    console.log("selected", action);
    if (
      currentPhase?.name == PhaseName.OPERATING_ACTION_COMPANY_VOTE &&
      currentPhase?.companyId === companyId
    ) {
      console.log("setting selected");
      setSelectedAction(action);
    }
  };
  const handleSubmit = async (action: OperatingRoundAction) => {
    if (currentPhase?.name == PhaseName.OPERATING_ACTION_COMPANY_VOTE) {
      try {
        await createOperatingRoundVote.mutate({
          operatingRoundId: currentPhase?.operatingRoundId || 0,
          playerId: authPlayer.id,
          companyId: company.id,
          actionVoted: action,
          gameId,
        });
        setSubmitComplete(true);
      } catch (error) {
        console.error(error);
      }
    }
  };
  return (
    <div className="flex flex-col gap-3 p-5">
      <h1 className="text-2xl">{company.name} Shareholder Meeting</h1>
      <div>
        <span className={`text-lg text-[${sectorColors[company.Sector.name]}]`}>
          {company.Sector.name}
        </span>
      </div>
      <div className="flex gap-2 items-center">
        <CompanyInfo company={company} />
        <div className="max-w-80">
          <ShareHolders companyId={company.id} />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <h3>Company Action Selection Vote</h3>

          <p>
            The company is considering the following actions. Please vote for
            the action you believe will benefit the company the most.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {companyActions.map((action) => (
            <div
              key={action.id}
              onClick={() => handleSelected(action.name, company.id)}
            >
              <Card
                isDisabled={checkIfDisabled(action.name)}
                className={`${
                  companyAction?.action == action.name ? "bg-blue-700" : ""
                } ${
                  selectedAction == action.name ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex flex-col">
                    <div className="flex justify-between">
                      <span className="font-bold mr-3">{action.title}</span>
                      <span>${CompanyActionCosts[action.name]}</span>
                    </div>
                    {action.name == OperatingRoundAction.LOAN && (
                      <span>One time only</span>
                    )}
                    {action.name == OperatingRoundAction.LOAN &&
                      company.hasLoan && <span>Loan has been taken.</span>}
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="flex flex-col">
                    {action.message}
                    {action.name == OperatingRoundAction.SPEND_PRESTIGE && (
                      <PrestigeRewards layout="minimalist" />
                    )}
                  </div>
                </CardBody>
                <CardFooter>
                  {currentPhase?.name ==
                    PhaseName.OPERATING_ACTION_COMPANY_VOTE &&
                  selectedAction == action.name &&
                  currentPhase?.companyId === company.id &&
                  submitComplete ? (
                    <div>Vote Submitted</div>
                  ) : (
                    <DebounceButton
                      onClick={() => handleSubmit(action.name)}
                      disabled={submitComplete}
                    >
                      Submit Vote
                    </DebounceButton>
                  )}
                  {actionVoteResults && (
                    <div className="flex gap-2">
                      {actionVoteResults
                        .filter(
                          (actionVoteResult) =>
                            actionVoteResult.actionVoted == action.name
                        )
                        .map((action: OperatingRoundVoteWithPlayer) => (
                          <PlayerAvatar
                            key={action.id}
                            badgeContent={action.weight}
                            player={action.Player}
                          />
                        ))}
                    </div>
                  )}
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CompanyActionSlider = ({ withResult }: { withResult?: boolean }) => {
  const { gameId, currentPhase } = useGame();
  const {
    data: companies,
    isLoading: isLoadingCompanies,
    error,
  } = trpc.company.listCompaniesWithSector.useQuery({
    where: { gameId, status: CompanyStatus.ACTIVE },
  });
  const {
    data: companyVoteResults,
    isLoading: isLoadingCompanyVoteResults,
    refetch: refetchCompanyVoteResults,
  } = trpc.operatingRound.getOperatingRoundWithActionVotes.useQuery(
    {
      where: {
        id: currentPhase?.operatingRoundId || "",
      },
      gameId,
    },
    {
      enabled: withResult,
    }
  );
  const {
    data: companyActions,
    isLoading: isLoadingCompanyAction,
    error: companyActionError,
    refetch: refetchCompanyAction,
  } = trpc.companyAction.listCompanyActions.useQuery({
    where: {
      operatingRoundId: currentPhase?.operatingRoundId || 0,
    },
  });

  const [currentCompany, setCurrentCompany] = useState<string | undefined>(
    undefined
  );
  useEffect(() => {
    if (companies && currentPhase) {
      setCurrentCompany(
        companies.find(
          (company) => company.id === (currentPhase.companyId || "")
        )?.id
      );
    }
  }, [companies, currentPhase, isLoadingCompanies]);
  useEffect(() => {
    refetchCompanyVoteResults();
    refetchCompanyAction();
  }, [currentPhase?.id]);
  if (isLoadingCompanies) return <div>Loading...</div>;
  if (!companies) return <div>No companies found</div>;
  if (!currentPhase) return <div>No current phase found</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (withResult && isLoadingCompanyVoteResults) return <div>Loading...</div>;
  if (withResult && !companyVoteResults) return <div>No results found</div>;
  const companiesSortedForTurnOrder =
    getCompanyOperatingRoundTurnOrder(companies);
  //I thought originally I'd get rid of this, but now I'm thinking
  //of preserving this behavior so players can flip through orders to review votes of other companies if they want.
  const handleNext = () => {
    setCurrentCompany((prev) => {
      if (!prev) return companiesSortedForTurnOrder[0].id;
      const currentIndex = companies.findIndex(
        (company) => company.id === prev
      );
      if (currentIndex === companies.length - 1)
        return companiesSortedForTurnOrder[0].id;
      return companies[currentIndex + 1].id;
    });
  };
  const handlePrevious = () => {
    setCurrentCompany((prev) => {
      if (!prev) return companiesSortedForTurnOrder[0].id;
      const currentIndex = companies.findIndex(
        (company) => company.id === prev
      );
      if (currentIndex === 0)
        return companiesSortedForTurnOrder[companies.length - 1].id;
      return companies[currentIndex - 1].id;
    });
  };
  const currentCompanyAction = companyActions?.find(
    (companyAction) => companyAction.companyId === currentCompany
  );
  return (
    <div className="flex flex-col flex-grow relative">
      <div className="flex flex-col gap-2 justify-center items-center">
        <h2>Turn Order</h2>
        <div className="flex gap-2">
          {companiesSortedForTurnOrder.map((company, index) => (
            <Avatar
              key={company.id}
              name={company.name}
              className={
                currentCompany === company.id ? "ring-2 ring-blue-500" : ""
              }
            />
          ))}
        </div>
        <Button onClick={handlePrevious}>Previous</Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentCompany}
          initial={{ opacity: 0, x: 200 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -200 }}
          className={`flex justify-center items-center`}
        >
          <div className="flex flex-col justify-center items-center">
            <CompanyActionSelectionVote
              company={companies.find(
                (company) => company.id === currentCompany
              )}
              actionVoteResults={companyVoteResults?.operatingRoundVote.filter(
                (vote) => vote.companyId === currentCompany
              )}
              companyAction={currentCompanyAction}
              withResult={withResult}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CompanyActionSlider;
