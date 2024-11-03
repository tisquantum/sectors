import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  ChipProps,
  Kbd,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tab,
  Tabs,
  Tooltip,
} from "@nextui-org/react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";
import {
  ACTION_ISSUE_SHARE_AMOUNT,
  CompanyActionCosts,
  CompanyActionPrestigeCosts,
  companyActionsDescription,
  CompanyTierData,
  DEFAULT_DECREASE_UNIT_PRICE,
  DEFAULT_INCREASE_UNIT_PRICE,
  GeneralCompanyActionCosts,
  LARGE_MARKETING_CAMPAIGN_DEMAND,
  LICENSING_AGREEMENT_UNIT_PRICE_BONUS,
  LOAN_AMOUNT,
  LOAN_INTEREST_RATE,
  LOBBY_DEMAND_BOOST,
  MARKETING_CONSUMER_BONUS,
  OURSOURCE_SUPPLY_BONUS,
  OUTSOURCE_PRESTIGE_PENALTY,
  SectorEffects,
  SMALL_MARKETING_CAMPAIGN_DEMAND,
} from "@server/data/constants";
import {
  CompanyAction,
  CompanyStatus,
  OperatingRoundAction,
  PhaseName,
  SectorName,
} from "@server/prisma/prisma.client";
import {
  CompanyWithRelations,
  OperatingRoundVoteWithPlayer,
} from "@server/prisma/prisma.types";
import ShareHolders from "./ShareHolders";
import { sectorColors } from "@server/data/gameData";
import PlayerAvatar from "../Player/PlayerAvatar";
import CompanyInfo from "./CompanyInfo";
import PrestigeRewards from "../Game/PrestigeRewards";
import DebounceButton from "@sectors/app/components/General/DebounceButton";
import {
  RiArrowLeftFill,
  RiArrowRightFill,
  RiBox2Fill,
  RiBuilding3Fill,
  RiCloseCircleFill,
  RiDiscountPercentFill,
  RiExpandUpDownFill,
  RiGlasses2Fill,
  RiHandCoinFill,
  RiInformation2Fill,
  RiLockFill,
  RiPercentFill,
  RiPriceTag3Fill,
  RiShapesFill,
  RiSparkling2Fill,
  RiStackFill,
  RiListOrdered2,
  RiTicket2Fill,
  RiWalletFill,
  RiBuilding2Fill,
} from "@remixicon/react";
import {
  companyPriorityOrderOperations,
  getCompanyActionCost,
} from "@server/data/helpers";
import {
  baseToolTipStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";
import CompanyPriorityList from "./CompanyPriorityOperatingRound";
import InsolvencyContributionComponent from "./InsolvencyContribution";
import { friendlyResearchName } from "@sectors/app/helpers";
import CompanyAwardTrack from "./CompanyAwardTrack";
import TabView from "../Game/TabView";

const renderSymbolDisplay = (operatingRoundAction: OperatingRoundAction) => {
  const IconWithText = ({
    icon,
    text,
  }: {
    icon: JSX.Element;
    text: string | number;
  }) => (
    <div className="flex items-center gap-2">
      {icon}
      <span>{text}</span>
    </div>
  );

  const Row = ({
    children,
    variant,
    color,
  }: {
    children: React.ReactNode;
    variant?: ChipProps["variant"];
    color?: ChipProps["color"];
  }) => (
    <Chip variant={variant} color={color}>
      {children}
    </Chip>
  );

  switch (operatingRoundAction) {
    case OperatingRoundAction.MARKETING:
      return (
        <div className="flex items-center flex-wrap gap-2">
          <Row variant="flat" color="success">
            <div className="flex items-center gap-1">
              <RiBuilding3Fill size={18} />
              <IconWithText
                icon={<RiHandCoinFill size={18} />}
                text={`+${LARGE_MARKETING_CAMPAIGN_DEMAND}`}
              />
            </div>
          </Row>
          <Row variant="flat" color="success">
            <div className="flex items-center items-center gap-1">
              <RiShapesFill size={18} />
              <IconWithText
                icon={<RiHandCoinFill size={18} />}
                text={`+${MARKETING_CONSUMER_BONUS}`}
              />
            </div>
          </Row>
          <Row variant="flat" color="warning">
            <div className="flex items-center gap-1">
              <RiBuilding2Fill size={18} />
              <RiShapesFill size={18} />
              <IconWithText icon={<RiHandCoinFill size={18} />} text={`-1`} />
              <span>/</span>
              <RiListOrdered2 size={18} />
            </div>
          </Row>
        </div>
      );

    case OperatingRoundAction.MARKETING_SMALL_CAMPAIGN:
      return (
        <div className="flex items-center flex-wrap gap-2">
          <Row variant="flat" color="success">
            <div className="flex items-center gap-1">
              <RiBuilding3Fill size={18} />
              <IconWithText
                icon={<RiHandCoinFill size={18} />}
                text={`+${SMALL_MARKETING_CAMPAIGN_DEMAND}`}
              />
            </div>
          </Row>
          <Row variant="flat" color="warning">
            <div className="flex items-center gap-1">
              <RiBuilding3Fill size={18} />
              <IconWithText icon={<RiHandCoinFill size={18} />} text={`-1`} />
              <span>/</span>
              <RiListOrdered2 size={18} />
            </div>
          </Row>
        </div>
      );

    case OperatingRoundAction.RESEARCH:
      return (
        <Row variant="flat" color="success">
          <IconWithText icon={<RiGlasses2Fill size={18} />} text="+1" />
        </Row>
      );

    case OperatingRoundAction.EXPANSION:
      return (
        <Row variant="flat" color="success">
          <IconWithText icon={<RiStackFill size={18} />} text="+1" />
        </Row>
      );

    case OperatingRoundAction.DOWNSIZE:
      return (
        <Row variant="flat" color="success">
          <IconWithText icon={<RiStackFill size={18} />} text="-1" />
        </Row>
      );

    case OperatingRoundAction.SHARE_BUYBACK:
      return (
        <Row variant="flat" color="success">
          <div className="flex items-center gap-1">
            <span>OM</span> <RiTicket2Fill size={18} /> <span>-1</span>
          </div>
        </Row>
      );

    case OperatingRoundAction.SHARE_ISSUE:
      return (
        <Row variant="flat" color="success">
          <div className="flex items-center gap-1">
            <span>OM</span> <RiTicket2Fill size={18} />
            <span>+{ACTION_ISSUE_SHARE_AMOUNT}</span>
          </div>
        </Row>
      );

    case OperatingRoundAction.LOAN:
      return (
        <div className="flex items-center flex-wrap gap-2">
          <Row variant="flat" color="success">
            <IconWithText
              icon={
                <>
                  <RiBuilding3Fill size={18} /> <RiWalletFill size={18} />
                </>
              }
              text={`$${LOAN_AMOUNT}`}
            />
          </Row>
          <Row variant="flat" color="warning">
            <div className="flex items-center gap-1">
              <RiPercentFill size={18} />
              <span>{LOAN_INTEREST_RATE} /</span> <RiListOrdered2 size={18} />
            </div>
          </Row>
        </div>
      );

    case OperatingRoundAction.INCREASE_PRICE:
      return (
        <Row variant="flat" color="success">
          <IconWithText
            icon={<RiPriceTag3Fill size={20} />}
            text={`+$${DEFAULT_INCREASE_UNIT_PRICE}`}
          />
        </Row>
      );

    case OperatingRoundAction.DECREASE_PRICE:
      return (
        <Row variant="flat" color="success">
          <IconWithText
            icon={<RiPriceTag3Fill size={20} />}
            text={`-$${DEFAULT_DECREASE_UNIT_PRICE}`}
          />
        </Row>
      );

    case OperatingRoundAction.LOBBY:
      return (
        <div className="flex flex-wrap gap-2">
          <Row variant="flat" color="success">
            <IconWithText
              icon={
                <>
                  <RiShapesFill size={18} /> <RiHandCoinFill size={20} />
                </>
              }
              text={`+${LOBBY_DEMAND_BOOST}`}
            />
          </Row>
          <Row variant="flat" color="warning">
            <div className="flex items-center gap-1">
              <span>-1</span> <RiShapesFill size={18} />
              <RiHandCoinFill size={20} /> / <RiListOrdered2 size={18} />
            </div>
          </Row>
        </div>
      );

    case OperatingRoundAction.OUTSOURCE:
      return (
        <div className="flex items-center flex-wrap gap-2">
          <Row variant="flat" color="success">
            <IconWithText
              icon={
                <>
                  <RiBuilding3Fill size={18} /> <RiBox2Fill size={18} />
                </>
              }
              text={`+${OURSOURCE_SUPPLY_BONUS} | MAX x2`}
            />
          </Row>
          <Row variant="flat" color="warning">
            <div className="flex items-center gap-1">
              <span>-1</span> <RiHandCoinFill size={18} />
              <span>/</span>
              <RiListOrdered2 size={18} />
            </div>
          </Row>
          <Row variant="flat" color="danger">
            <IconWithText
              icon={<RiSparkling2Fill size={18} />}
              text={`-${OUTSOURCE_PRESTIGE_PENALTY}`}
            />
          </Row>
        </div>
      );

    case OperatingRoundAction.LICENSING_AGREEMENT:
      return (
        <Row variant="flat" color="success">
          <IconWithText
            icon={<RiPriceTag3Fill size={20} />}
            text={`+${LICENSING_AGREEMENT_UNIT_PRICE_BONUS}`}
          />
        </Row>
      );

    case OperatingRoundAction.EXTRACT:
    case OperatingRoundAction.MANUFACTURE:
      return (
        <Row variant="flat" color="success">
          <IconWithText
            icon={
              <>
                <RiBuilding3Fill size={18} /> <RiBox2Fill size={18} />
              </>
            }
            text="+1"
          />
        </Row>
      );

    case OperatingRoundAction.VETO:
      return (
        <Row variant="flat" color="success">
          <div className="flex items-center gap-1">
            <RiExpandUpDownFill size={18} />
            <RiDiscountPercentFill size={18} />
            <span>-50</span>
          </div>
        </Row>
      );

    default:
      return <></>;
  }
};

const CompanyActionSelectionVote = ({
  company,
  actionVoteResults,
  companyActions,
  withResult,
  allCompanyActions,
}: {
  company?: CompanyWithRelations;
  actionVoteResults?: OperatingRoundVoteWithPlayer[];
  withResult?: boolean;
  companyActions?: CompanyAction[];
  allCompanyActions?: CompanyAction[];
}) => {
  const { currentPhase, authPlayer, gameId, researchDeck } = useGame();
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
    if (
      getCompanyActionCost(
        actionName,
        company.currentStockPrice,
        allCompanyActions?.filter(
          (companyAction) => companyAction.action === actionName
        ).length
      ) > company.cashOnHand
    )
      return true;
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
    if (!authPlayer) {
      return;
    }
    setIsLoadingSelectionVote(true);
    if (currentPhase?.name === PhaseName.OPERATING_ACTION_COMPANY_VOTE) {
      try {
        await Promise.all(
          selectedActions.map(async (action) => {
            await createOperatingRoundVote.mutate({
              operatingRoundId: currentPhase?.operatingRoundId || "",
              playerId: authPlayer.id,
              companyId: company.id,
              actionVoted: action,
              gameId,
            });
          })
        );
        setIsLoadingSelectionVote(false);
        setSubmitComplete(true);
      } catch (error) {
        console.error(error);
      }
    }
  };
  let availableActions = companyActionsDescription.filter(
    (action) => action.id < 16
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
  const companySectorPassiveEffect =
    SectorEffects[company.Sector.sectorName]?.passive;
  if (
    companySectorPassiveEffect &&
    (company.Sector.sectorName == SectorName.INDUSTRIALS ||
      company.Sector.sectorName == SectorName.MATERIALS) &&
    company.CompanyActions.some(
      (companyAction) =>
        companyAction.action === OperatingRoundAction.EXTRACT ||
        companyAction.action === OperatingRoundAction.MANUFACTURE
    )
  ) {
    //add back in the relevant sector passive action
    const sectorPassiveAction = companyActionsDescription.find(
      (action) => action.name === companySectorPassiveEffect
    );
    if (sectorPassiveAction) {
      availableActions.push(sectorPassiveAction);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-5">
      <h1 className="text-lg lg:text-2xl">
        {company.name} Shareholder Meeting
      </h1>
      <div className="flex gap-1">
        <span
          className={`text-base lg:text-lg text-[${
            sectorColors[company.Sector.name]
          }]`}
        >
          {company.Sector.name}
        </span>
        {company.status === CompanyStatus.INSOLVENT && (
          <Chip color="danger">
            <span className="text-base lg:text-lg">Insolvent</span>
          </Chip>
        )}
        {company.status === CompanyStatus.ACTIVE && (
          <Chip color="success">
            <span className="text-base lg:text-lg">Active</span>
          </Chip>
        )}
      </div>
      <div className="flex gap-2 items-center">
        <CompanyInfo companyId={company.id} />
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
                Vote for the action(s) you believe will benefit the company the
                most. You can select up to {companyAllowedActions} actions.
                Votes are weighted based on the number of shares you own. If you
                do not own shares in the company, your vote will not be counted.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {availableActions.map((action) => {
                const currentCost = () => {
                  const companyActionCost = companyActions?.find(
                    (companyAction) => companyAction.action === action.name
                  )?.cost;
                  if (companyActionCost) {
                    return companyActionCost;
                  }
                  if (action.actionType == "general") {
                    return getCompanyActionCost(
                      action.name,
                      company.currentStockPrice,
                      allCompanyActions?.filter(
                        (actionName) => actionName.action === action.name
                      ).length
                    );
                  } else {
                    return getCompanyActionCost(
                      action.name,
                      company.currentStockPrice
                    );
                  }
                };
                const companyCosts = () => {
                  if (action.name === OperatingRoundAction.SHARE_BUYBACK) {
                    return [company.currentStockPrice];
                  }
                  if (action.actionType == "general") {
                    return GeneralCompanyActionCosts[
                      action.name as keyof typeof GeneralCompanyActionCosts
                    ];
                  }
                  return [
                    CompanyActionCosts[
                      action.name as keyof typeof CompanyActionCosts
                    ],
                  ];
                };
                return (
                  <div
                    key={action.id}
                    onClick={() => handleSelected(action.name, company.id)}
                    className="h-full"
                  >
                    <Card
                      isDisabled={checkIfDisabled(action.name)}
                      className={`h-full ${
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
                        (action.name === companySectorActiveEffect ||
                          action.name === companySectorPassiveEffect) &&
                        `bg-[${sectorColors[company.Sector.name]}]`
                      }
                    `}
                    >
                      <CardHeader>
                        <div className="flex flex-col w-full">
                          <div className="flex gap-1 justify-between items-center">
                            <div className="flex items-center gap-1">
                              <span className="font-bold">{action.title}</span>
                            </div>
                            <div className="flex flex-wrap justify-end gap-1">
                              <Popover>
                                <PopoverTrigger>
                                  <Button className="cursor-pointer" isIconOnly>
                                    <RiInformation2Fill />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent>
                                  <div className="flex items-center justify-center p-2 max-w-[200px]">
                                    <p>{action.message}</p>
                                  </div>
                                </PopoverContent>
                              </Popover>
                              {action.name ===
                                OperatingRoundAction.RESEARCH && (
                                <Popover>
                                  <PopoverTrigger>
                                    <Button isIconOnly>
                                      <RiGlasses2Fill />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent>
                                    <div className="grid grid-cols-3 gap-4">
                                      {researchDeck.cards.map((card) => (
                                        <div
                                          key={card.id}
                                          className="p-4 bg-gray-700 rounded-md text-white"
                                        >
                                          <h3 className="text-lg">
                                            {friendlyResearchName(card.effect)}
                                          </h3>
                                          <p>{card.description}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardBody>
                        <div className="flex flex-col">
                          {renderSymbolDisplay(action.name)}
                          {action.name ===
                            OperatingRoundAction.SPEND_PRESTIGE && (
                            <PrestigeRewards layout="minimalist" />
                          )}
                          {action.name === OperatingRoundAction.LOAN && (
                            <Chip className="mt-2" color="warning">
                              One time only
                            </Chip>
                          )}
                          {action.name === OperatingRoundAction.LOAN &&
                            company.hasLoan && (
                              <Chip className="mt-2" color="warning">
                                Loan has been taken
                              </Chip>
                            )}
                        </div>
                      </CardBody>
                      <CardFooter>
                        <div className="flex w-full flex-col gap-2">
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
                                onClick={() =>
                                  handleRemoveSelection(action.name)
                                }
                                isIconOnly
                              >
                                <RiCloseCircleFill />
                              </Button>
                            )}
                          <div className="flex flex-wrap justify-end gap-2">
                            {companyCosts().map((cost) => (
                              <span
                                key={cost} // Add a unique key for each item
                                className={`px-2 py-1 rounded-md text-sm xl:text-base ${
                                  cost === currentCost()
                                    ? "bg-blue-500 text-white font-semibold"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                              >
                                ${cost}
                              </span>
                            ))}
                            {CompanyActionPrestigeCosts[action.name] > 0 && (
                              <div className="flex gap-1 items-center">
                                <RiSparkling2Fill />
                                <span className="text-sm xl:text-base">
                                  {CompanyActionPrestigeCosts[action.name]}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const CompanyActionSlider = ({ withResult }: { withResult?: boolean }) => {
  const { gameId, currentPhase, currentTurn } = useGame();
  const {
    data: companies,
    isLoading: isLoadingCompanies,
    error,
  } = trpc.company.listCompaniesWithRelations.useQuery({
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
  const {
    data: currentTurnWithRelations,
    isLoading: currentTurnIsLoading,
    isError: currentTurnIsError,
    refetch: refetchCurrentTurn,
  } = trpc.gameTurn.getCurrentGameTurnWithRelations.useQuery({ gameId });
  const [currentCompany, setCurrentCompany] = useState<string | undefined>(
    undefined
  );
  const { data: companyAwardTracks, isLoading: isLoadingCompanyAwardTracks } =
    trpc.companyAwardTrack.listCompanyAwardTracks.useQuery({
      where: {
        gameId,
      },
    });
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
  if (currentTurnIsLoading) return <div>Loading...</div>;
  if (!currentTurnWithRelations) return <div>No turn found</div>;
  if (isLoadingCompanyAwardTracks) return <div>Loading...</div>;
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
  const activeCompaniesSortedUnlocked = activeCompanies.sort(
    (a, b) =>
      companiesSortedForTurnOrder.findIndex((c) => c.id === a.id) -
      companiesSortedForTurnOrder.findIndex((c) => c.id === b.id)
  );
  const activeCompaniesSortedLocked =
    currentTurnWithRelations.companyActionOrder
      .sort((a, b) => a.orderPriority - b.orderPriority)
      .map((companyActionOrder) =>
        activeCompanies.find(
          (company) => company.id == companyActionOrder.companyId
        )
      )
      .filter((company) => company != undefined);
  const showLock =
    activeCompaniesSortedLocked.length > 0 &&
    (currentPhase.name == PhaseName.OPERATING_ACTION_COMPANY_VOTE ||
      currentPhase.name == PhaseName.OPERATING_ACTION_COMPANY_VOTE_RESULT ||
      currentPhase.name == PhaseName.OPERATING_COMPANY_VOTE_RESOLVE);
  const activeCompaniesSorted = showLock
    ? activeCompaniesSortedLocked
    : activeCompaniesSortedUnlocked;
  const collectedCompanies = [
    ...insolventCompanies,
    ...activeCompaniesSorted,
  ] as CompanyWithRelations[];

  //I thought originally I'd get rid of this, but now I'm thinking
  //of preserving this behavior so players can flip through orders to review votes of other companies if they want.
  const handleNext = () => {
    if (collectedCompanies?.length > 0) {
      setCurrentCompany((prev) => {
        if (!prev) return collectedCompanies[0]?.id || undefined; // Return undefined instead of null
        const currentIndex = collectedCompanies.findIndex(
          (company) => company?.id === prev // Add check for undefined company
        );
        if (
          currentIndex === -1 ||
          currentIndex === collectedCompanies.length - 1
        ) {
          return collectedCompanies[0]?.id || undefined; // Return undefined instead of null
        }
        return collectedCompanies[currentIndex + 1]?.id || undefined; // Return undefined instead of null
      });
    }
  };

  const handlePrevious = () => {
    if (collectedCompanies?.length > 0) {
      setCurrentCompany((prev) => {
        if (!prev) return collectedCompanies[0]?.id || undefined; // Return undefined instead of null
        const currentIndex = collectedCompanies.findIndex(
          (company) => company?.id === prev // Add check for undefined company
        );
        if (currentIndex === -1 || currentIndex === 0) {
          return (
            collectedCompanies[collectedCompanies.length - 1]?.id || undefined
          ); // Return undefined instead of null
        }
        return collectedCompanies[currentIndex - 1]?.id || undefined; // Return undefined instead of null
      });
    }
  };

  const currentCompanyActions = companyActions?.filter(
    (companyAction) => companyAction.companyId === currentCompany
  );
  console.log("collectedCompanies", collectedCompanies);
  return (
    <div className="flex flex-col gap-4">
      <Tabs>
        <Tab key="company-selection" title="Company Vote">
          <div className="flex flex-col gap-1 flex-grow relative">
            <div className="flex flex-col gap-2 justify-center items-center">
              <Tooltip
                classNames={{ base: baseToolTipStyle }}
                className={tooltipStyle}
                content={<CompanyPriorityList companies={companies} />}
              >
                <h2>Turn Order</h2>
              </Tooltip>
              <div className="flex flex-col gap-2 justify-center items-center">
                {showLock && <RiLockFill />}
                <div className="flex gap-2">
                  {collectedCompanies.map((company, index) => (
                    <div
                      key={company.id}
                      className={`flex items-center justify-center p-2 w-14 h-14 rounded-full text-white text-xs lg:text-sm font-bold ${
                        currentCompany === company.id
                          ? `${
                              company.status === CompanyStatus.INSOLVENT
                                ? "bg-rose-500"
                                : "bg-blue-500"
                            }`
                          : company.status === CompanyStatus.INSOLVENT
                          ? "bg-rose-500"
                          : "bg-gray-500"
                      }`}
                    >
                      {company.stockSymbol}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handlePrevious}>
                    <RiArrowLeftFill />
                  </Button>
                  <Button onClick={handleNext}>
                    <RiArrowRightFill />
                  </Button>
                </div>
              </div>
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
                    allCompanyActions={companyActions}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Tab>
        <Tab key="company-award" title="Company Awards">
          <div className="flex flex-col gap-4">
            {companyAwardTracks &&
              companyAwardTracks.map((awardTrack) => (
                <CompanyAwardTrack
                  key={awardTrack.id}
                  companyAwardTrackId={awardTrack.id}
                />
              ))}
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default CompanyActionSlider;
