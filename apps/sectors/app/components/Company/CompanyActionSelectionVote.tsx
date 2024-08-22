import {
  Avatar,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Tooltip,
} from "@nextui-org/react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import CompanyActionVote from "./CompanyActionVote";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";
import {
  ACTION_ISSUE_SHARE_AMOUNT,
  CompanyActionCosts,
  CompanyActionPrestigeCosts,
  CompanyTierData,
  DEFAULT_DECREASE_UNIT_PRICE,
  DEFAULT_INCREASE_UNIT_PRICE,
  getCompanyOperatingRoundTurnOrder,
  LARGE_MARKETING_CAMPAIGN_DEMAND,
  LOAN_AMOUNT,
  LOAN_INTEREST_RATE,
  LOBBY_DEMAND_BOOST,
  MARKETING_CONSUMER_BONUS,
  OURSOURCE_SUPPLY_BONUS,
  PRESTIGE_ACTION_TOKEN_COST,
  SectorEffects,
  SMALL_MARKETING_CAMPAIGN_DEMAND,
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
import { RiCloseCircleFill, RiSparkling2Fill } from "@remixicon/react";
import { companyPriorityOrderOperations } from "@server/data/helpers";
import { tooltipStyle } from "@sectors/app/helpers/tailwind.helpers";
import CompanyPriorityList from "./CompanyPriorityOperatingRound";
import InsolvencyContributionComponent from "./InsolvencyContribution";

const companyActionsDescription = [
  {
    id: 1,
    title: "Large Marketing Campaign",
    name: OperatingRoundAction.MARKETING,
    message: `The sector receives an additional ${MARKETING_CONSUMER_BONUS} consumers. Your company receives +${LARGE_MARKETING_CAMPAIGN_DEMAND} demand that decays 1 per production phase.`,
  },
  {
    id: 2,
    title: "Small Marketing Campaign",
    name: OperatingRoundAction.MARKETING_SMALL_CAMPAIGN,
    message: `The company receives +${SMALL_MARKETING_CAMPAIGN_DEMAND} demand that decays 1 per production phase.`,
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
    message: `Issue ${ACTION_ISSUE_SHARE_AMOUNT} share(s) to the open market.`,
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
    message: `Lobby the government to force demand in your favor. Boost the sectors demand by ${LOBBY_DEMAND_BOOST}. This demand will decay 1 per stock price adjustment phase.`,
  },
  {
    id: 13,
    title: "Outsource",
    name: OperatingRoundAction.OUTSOURCE,
    message: `The company outsources production.  Increase supply by ${OURSOURCE_SUPPLY_BONUS} that decays once per turn.  Lose all prestige tokens. A company may only ever have up to twice of the maximum supply it's company tier allows.`,
  },
  {
    id: 14,
    title: "Veto",
    name: OperatingRoundAction.VETO,
    message:
      "The company does nothing this turn. Pick this to ensure the company will not act on any other proposal. Additionally, the next turn this companies operating costs are 50% less.",
  },
  //sector specific actions active effects
  //technology
  {
    id: 15,
    title: "Visionary",
    name: OperatingRoundAction.VISIONARY,
    message:
      "Draw 2 research cards and the company gains +1 demand permanently.",
  },
  //materials
  {
    id: 16,
    title: "Strategic Reserve",
    name: OperatingRoundAction.STRATEGIC_RESERVE,
    message:
      "The company has no production cost next turn and revenue is increased 10%.",
  },
  //industrial
  {
    id: 17,
    title: "Rapid Expansion",
    name: OperatingRoundAction.RAPID_EXPANSION,
    message: "The company expands two levels.",
  },
  //Healthcare
  {
    id: 18,
    title: "Fast-track Approval",
    name: OperatingRoundAction.FASTTRACK_APPROVAL,
    message: "The company gains +5 demand that decays 1 per turn.",
  },
  //consumer defensive
  {
    id: 19,
    title: "Price Freeze",
    name: OperatingRoundAction.PRICE_FREEZE,
    message:
      "The company stock price will move a maximum of 2 spaces next turn.",
  },
  //consumer cyclical
  {
    id: 20,
    title: "Re-Brand",
    name: OperatingRoundAction.REBRAND,
    message:
      "The company gains +1 temporary demand, +1 permanent demand and a $40 increase in price.",
  },
  //energy
  {
    id: 21,
    title: "Surge Pricing",
    name: OperatingRoundAction.SURGE_PRICING,
    message: "Next turn, company revenue is increased 25%.",
  },
  //passive effect badges
  //technology
  {
    id: 21,
    title: "Innovation Surge",
    name: OperatingRoundAction.INNOVATION_SURGE,
    message: "Should the company draw a research card, draw 2 cards instead.",
  },
  //healthcare
  {
    id: 22,
    title: "Regulatory Shield",
    name: OperatingRoundAction.REGULATORY_SHIELD,
    message:
      "Should the company stock price decrease, it will stop at the top of the next stock price tier should it drop any further.",
  },
  //materials
  {
    id: 23,
    title: "Supply Chain",
    name: OperatingRoundAction.SUPPLY_CHAIN,
    message: "The company gains +1 permanent supply.",
  },
  //industrial
  {
    id: 24,
    title: "Operating Round Action",
    name: OperatingRoundAction.ROBOTICS,
    message:
      "This company is charged the operational cost of the tier underneath it, with a minimum of 0.",
  },
  //consumer defensive
  {
    id: 25,
    title: "Steady Demand",
    name: OperatingRoundAction.STEADY_DEMAND,
    message:
      "Should the company have remaining demand but no consumers are available, sell up to 2 demand anyway.",
  },
  //consumer cyclical
  {
    id: 26,
    title: "Boom Cycle",
    name: OperatingRoundAction.BOOM_CYCLE,
    message:
      "Would the companies stock price be stopped by a new price tier, allow it to move up at least 3 spaces further.",
  },
  //energy
  {
    id: 27,
    title: "Carbon Credit",
    name: OperatingRoundAction.CARBON_CREDIT,
    message: "This companies throughput can never be less than 1.",
  },
];
const CompanyActionSelectionVote = ({
  company,
  actionVoteResults,
  companyActions,
  withResult,
}: {
  company?: CompanyWithSector;
  actionVoteResults?: OperatingRoundVoteWithPlayer[];
  withResult?: boolean;
  companyActions?: CompanyAction[];
}) => {
  const { currentPhase, authPlayer, gameId } = useGame();
  const [isLoadingSelectionVote, setIsLoadingSelectionVote] = useState(false);
  const [submitComplete, setSubmitComplete] = useState(false);
  const [selectedActions, setSelectedActions] = useState<
    OperatingRoundAction[]
  >([]);
  const createOperatingRoundVote =
    trpc.operatingRoundVote.createOperatingRoundVote.useMutation({
      onSettled: () => {
        setIsLoadingSelectionVote(false);
      },
    });

  if (!company) return <div>No company found</div>;

  const companyAllowedActions =
    CompanyTierData[company.companyTier].companyActions;

  const checkIfDisabled = (actionName: OperatingRoundAction) => {
    if (CompanyActionCosts[actionName] > company.cashOnHand) return true;
    if (CompanyActionPrestigeCosts[actionName] > company.prestigeTokens)
      return true;
    if (actionName === OperatingRoundAction.LOAN && company.hasLoan)
      return true;
    return false;
  };

  const handleSelected = (action: OperatingRoundAction, companyId: string) => {
    if (
      currentPhase?.name === PhaseName.OPERATING_ACTION_COMPANY_VOTE &&
      currentPhase?.companyId === companyId
    ) {
      setSelectedActions((prevSelected) => {
        if (prevSelected.includes(action)) {
          // Deselect the action if it's already selected
          return prevSelected.filter((selected) => selected !== action);
        } else if (prevSelected.length < companyAllowedActions) {
          // Add the new action if the limit isn't reached
          return [...prevSelected, action];
        } else if (companyAllowedActions === 1) {
          // Replace the only allowed action if the limit is 1
          return [action];
        } else {
          return prevSelected;
        }
      });
    }
  };

  const handleRemoveSelection = (action: OperatingRoundAction) => {
    setSelectedActions((prevSelected) =>
      prevSelected.filter((selected) => selected !== action)
    );
  };

  const handleSubmit = async () => {
    setIsLoadingSelectionVote(true);
    if (currentPhase?.name === PhaseName.OPERATING_ACTION_COMPANY_VOTE) {
      try {
        await Promise.all(
          selectedActions.map(async (action) => {
            await createOperatingRoundVote.mutate({
              operatingRoundId: currentPhase?.operatingRoundId || 0,
              playerId: authPlayer.id,
              companyId: company.id,
              actionVoted: action,
              gameId,
            });
          })
        );
        setSubmitComplete(true);
      } catch (error) {
        console.error(error);
      }
    }
  };
  let availableActions = companyActionsDescription.filter(
    (action) => action.id < 15
  );

  const companySectorActiveEffect =
    SectorEffects[company.Sector.sectorName]?.active;
  if (companySectorActiveEffect) {
    //add back in the relevant sector active action
    const sectorActiveAction = companyActionsDescription.find(
      (action) => action.name === companySectorActiveEffect
    );
    if (sectorActiveAction) {
      availableActions.push(sectorActiveAction);
    }
  }
  return (
    <div className="flex flex-col gap-3 p-5">
      <h1 className="text-2xl">{company.name} Shareholder Meeting</h1>
      <div className="flex gap-1">
        <span className={`text-lg text-[${sectorColors[company.Sector.name]}]`}>
          {company.Sector.name}
        </span>
        {company.status === CompanyStatus.INSOLVENT && (
          <Chip color="danger">
            <span className="text-lg">Insolvent</span>
          </Chip>
        )}
        {company.status === CompanyStatus.ACTIVE && (
          <Chip color="success">
            <span className="text-lg">Active</span>
          </Chip>
        )}
      </div>
      <div className="flex gap-2 items-center">
        <CompanyInfo company={company} />
        <div className="max-w-80">
          <ShareHolders companyId={company.id} />
        </div>
      </div>
      {company.status === CompanyStatus.INSOLVENT ? (
        <InsolvencyContributionComponent company={company} />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <div>
              <h3>Company Action Selection Vote</h3>
              <p>
                The company is considering the following actions. Please vote
                for the action(s) you believe will benefit the company the most.
                You can select up to {companyAllowedActions} actions.
              </p>
            </div>
            <div className="flex justify-center">
              {submitComplete ? (
                <div>
                  <span>Vote(s) Submitted</span>
                </div>
              ) : currentPhase?.name ===
                  PhaseName.OPERATING_ACTION_COMPANY_VOTE &&
                currentPhase?.companyId === company.id ? (
                <DebounceButton
                  onClick={handleSubmit}
                  disabled={submitComplete}
                  isLoading={isLoadingSelectionVote}
                >
                  Submit All Votes
                </DebounceButton>
              ) : null}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {availableActions.map((action) => (
                <div
                  key={action.id}
                  onClick={() => handleSelected(action.name, company.id)}
                >
                  <Card
                    isDisabled={checkIfDisabled(action.name)}
                    className={`${
                      companyActions?.some((ca) => ca.action === action.name)
                        ? "bg-blue-700"
                        : ""
                    } ${
                      selectedActions.includes(action.name) &&
                      currentPhase?.name ===
                        PhaseName.OPERATING_ACTION_COMPANY_VOTE
                        ? "ring-2 ring-blue-500"
                        : ""
                    } ${
                      companySectorActiveEffect &&
                      action.name === companySectorActiveEffect &&
                      `bg-[${sectorColors[company.Sector.name]}]`
                    }
                    `}
                  >
                    <CardHeader>
                      <div className="flex flex-col">
                        <div className="flex gap-1 justify-between">
                          <span className="font-bold mr-3">{action.title}</span>
                          <span>${CompanyActionCosts[action.name]}</span>
                          {CompanyActionPrestigeCosts[action.name] > 0 && (
                            <div className="flex">
                              <RiSparkling2Fill />
                              <span>
                                {CompanyActionPrestigeCosts[action.name]}
                              </span>
                            </div>
                          )}
                        </div>
                        {action.name === OperatingRoundAction.LOAN && (
                          <span>One time only</span>
                        )}
                        {action.name === OperatingRoundAction.LOAN &&
                          company.hasLoan && <span>Loan has been taken.</span>}
                      </div>
                    </CardHeader>
                    <CardBody>
                      <div className="flex flex-col">
                        {action.message}
                        {action.name ===
                          OperatingRoundAction.SPEND_PRESTIGE && (
                          <PrestigeRewards layout="minimalist" />
                        )}
                      </div>
                    </CardBody>
                    <CardFooter>
                      {actionVoteResults && (
                        <div className="flex gap-2">
                          {actionVoteResults
                            .filter(
                              (actionVoteResult) =>
                                actionVoteResult.actionVoted === action.name
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
                      {selectedActions.includes(action.name) &&
                        companyAllowedActions > 1 &&
                        currentPhase?.name ===
                          PhaseName.OPERATING_ACTION_COMPANY_VOTE &&
                        currentPhase?.companyId === company.id && (
                          <Button
                            className="text-red-500"
                            onClick={() => handleRemoveSelection(action.name)}
                          >
                            <RiCloseCircleFill />
                          </Button>
                        )}
                    </CardFooter>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
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
    where: {
      gameId,
      OR: [
        { status: CompanyStatus.ACTIVE },
        { status: CompanyStatus.INSOLVENT },
      ],
    },
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
  const activeCompanies = companies.filter(
    (company) => company.status === CompanyStatus.ACTIVE
  );
  const insolventCompanies = companies.filter(
    (company) => company.status === CompanyStatus.INSOLVENT
  );
  const companiesSortedForTurnOrder =
    companyPriorityOrderOperations(activeCompanies);
  //sort companies by turn order
  const activeCompaniesSorted = activeCompanies.sort(
    (a, b) =>
      companiesSortedForTurnOrder.findIndex((c) => c.id === a.id) -
      companiesSortedForTurnOrder.findIndex((c) => c.id === b.id)
  );
  const collectedCompanies = [...insolventCompanies, ...activeCompaniesSorted];
  //I thought originally I'd get rid of this, but now I'm thinking
  //of preserving this behavior so players can flip through orders to review votes of other companies if they want.
  const handleNext = () => {
    setCurrentCompany((prev) => {
      if (!prev) return collectedCompanies[0].id;
      const currentIndex = collectedCompanies.findIndex(
        (company) => company.id === prev
      );
      if (currentIndex === collectedCompanies.length - 1)
        return collectedCompanies[0].id;
      return collectedCompanies[currentIndex + 1].id;
    });
  };
  const handlePrevious = () => {
    setCurrentCompany((prev) => {
      if (!prev) return collectedCompanies[0].id;
      const currentIndex = collectedCompanies.findIndex(
        (company) => company.id === prev
      );
      if (currentIndex === 0)
        return collectedCompanies[collectedCompanies.length - 1].id;
      return collectedCompanies[currentIndex - 1].id;
    });
  };
  const currentCompanyActions = companyActions?.filter(
    (companyAction) => companyAction.companyId === currentCompany
  );
  return (
    <div className="flex flex-col flex-grow relative">
      <div className="flex flex-col gap-2 justify-center items-center">
        <Tooltip
          className={tooltipStyle}
          content={<CompanyPriorityList companies={companies} />}
        >
          <h2>Turn Order</h2>
        </Tooltip>
        <div className="flex gap-2">
          {collectedCompanies.map((company, index) => (
            <Avatar
              key={company.id}
              name={company.name}
              className={
                currentCompany === company.id
                  ? `ring-2 ring-blue-500 ${
                      company.status == CompanyStatus.INSOLVENT && "bg-rose-500"
                    }`
                  : `${
                      company.status == CompanyStatus.INSOLVENT && "bg-rose-500"
                    }`
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
              companyActions={currentCompanyActions}
              withResult={withResult}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CompanyActionSlider;
