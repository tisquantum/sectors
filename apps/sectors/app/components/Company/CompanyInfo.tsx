import {
  Accordion,
  AccordionItem,
  Button,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  useDisclosure,
} from "@nextui-org/react";
import {
  RiBankCard2Fill,
  RiBox2Fill,
  RiBuilding3Fill,
  RiExpandUpDownFill,
  RiFundsBoxFill,
  RiFundsFill,
  RiGameFill,
  RiGlasses2Fill,
  RiGovernmentFill,
  RiHandCoinFill,
  RiIncreaseDecreaseFill,
  RiPriceTag3Fill,
  RiSailboatFill,
  RiShapesFill,
  RiSparkling2Fill,
  RiStackFill,
  RiTeamFill,
  RiUserFill,
  RiWallet3Fill,
} from "@remixicon/react";
import {
  baseToolTipStyle,
  tooltipParagraphStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";
import {
  companyActionsDescription,
  CompanyTierData,
  LOAN_AMOUNT,
  LOAN_INTEREST_RATE,
  SectorEffects,
} from "@server/data/constants";
import { sectorColors } from "@server/data/gameData";
import { calculateCompanySupply, calculateDemand } from "@server/data/helpers";
import {
  CompanyStatus,
  OperationMechanicsVersion,
  Player,
  Share,
  ShareLocation,
} from "@server/prisma/prisma.client";
import {
  CompanyWithSector,
  ShareWithPlayer,
} from "@server/prisma/prisma.types";
import { BarList, LineChart } from "@tremor/react";
import ThroughputLegend from "../Game/ThroughputLegend";
import { trpc } from "@sectors/app/trpc";
import CompanyTiers from "./CompanyTiers";
import { MoneyTransactionHistoryByCompany } from "../Game/MoneyTransactionHistory";
import PassiveEffect from "./PassiveEffect";
import { useGame } from "../Game/GameContext";
import { useEffect } from "react";
import ShareComponent from "./Share";
import { renderLocationShortHand } from "@sectors/app/helpers";
import PlayerAvatar from "../Player/PlayerAvatar";
import { CompanyLineChart } from "./CompanyLineChart";
import CompanyResearchCards from "./CompanyResearchCards";
import { ModernCompany } from "./ModernCompany";

const buildBarChart = (shares: ShareWithPlayer[]) => {
  //group shares by location and sum the quantity
  const groupedShares = shares.reduce((acc, share) => {
    if (!acc[share.location]) {
      acc[share.location] = 0;
    }
    acc[share.location] += 1;
    return acc;
  }, {} as Record<string, number>);
  //convert object to array
  return Object.entries(groupedShares).map(([location, quantity], index) =>
    location == ShareLocation.PLAYER ? (
      <Popover key={index}>
        <PopoverTrigger>
          <div className="flex justify-center items-center cursor-pointer">
            <ShareComponent
              name={"Player"}
              icon={<RiUserFill className={"text-slate-800"} size={18} />}
              quantity={quantity}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent>
          <div className="flex flex-wrap gap-1">
            {Object.values(
              shares
                .filter((share) => share.location === ShareLocation.PLAYER)
                .reduce((acc, share) => {
                  const playerId = share.Player?.id;
                  if (playerId && share.Player) {
                    if (!acc[playerId]) {
                      acc[playerId] = {
                        quantity: 0,
                        Player: share.Player,
                      };
                    }
                    acc[playerId].quantity += 1; // Sum the quantity for each player
                  }
                  return acc;
                }, {} as Record<string, { quantity: number; Player: Player }>) // Accumulate by player ID
            ).map((shareData, index) => (
              <div key={index} className="flex gap-2 items-center">
                <div className="flex items-center">
                  {shareData.Player && (
                    <PlayerAvatar player={shareData.Player} />
                  )}
                </div>
                <span>{shareData.quantity}</span>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    ) : (
      <ShareComponent
        key={index}
        name={renderLocationShortHand(location as ShareLocation)}
        quantity={quantity}
      />
    )
  );
};

const CompanyMoreInfo = ({
  company,
  showingProductionResults,
}: {
  company: CompanyWithSector;
  showingProductionResults?: boolean;
}) => {
  return (
    <div className="flex gap-1 my-2">
      <div
        className="flex flex-col px-2 rounded-md"
        style={{ backgroundColor: sectorColors[company.Sector.name] }}
      >
        <div className="flex items-center gap-1">
          <RiShapesFill size={18} />
          <span>{company.Sector.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip
            classNames={{ base: baseToolTipStyle }}
            className={tooltipStyle}
            content={
              <p className={tooltipParagraphStyle}>
                Sector demand determins how many customers will visit this
                sector every turn. Everytime a new company opens in this sector,
                this demand increases permanently by 1. The company lobby action
                will also increase this value temporarily.
              </p>
            }
          >
            <div className="flex items-center">
              <RiHandCoinFill size={18} className="ml-2" />
              <span className="ml-1">
                {company.Sector.demand + (company.Sector.demandBonus || 0)}
              </span>
            </div>
          </Tooltip>
          <Tooltip
            classNames={{ base: baseToolTipStyle }}
            className={tooltipStyle}
            content={
              <p className={tooltipParagraphStyle}>
                The amount of consumers currently looking to buy in this sector.
              </p>
            }
          >
            <div className="flex items-center">
              <RiTeamFill size={18} className="ml-2" />
              <span className="ml-1">{company.Sector.consumers}</span>
            </div>
          </Tooltip>
        </div>
      </div>
      <div className="flex flex-wrap items-center">
        <Tooltip
          classNames={{ base: baseToolTipStyle }}
          className={tooltipStyle}
          content={
            <p className={tooltipParagraphStyle}>
              Prestige tokens. While held, they help prioritize the company for
              production. Can be spent for a bonus. How to earn prestige: If a
              company sells all of it&apos;s supply during an operating round,
              it earns 1 prestige token.
            </p>
          }
        >
          <div className="flex items-center">
            <RiSparkling2Fill
              size={18}
              className="ml-2 size-4 text-yellow-500"
            />
            <span className="ml-1">{company.prestigeTokens}</span>
          </div>
        </Tooltip>
        <Tooltip
          classNames={{ base: baseToolTipStyle }}
          className={tooltipStyle}
          content={
            <p className={tooltipParagraphStyle}>
              The companies demand score. The maximum amount of customers that
              will visit your company before visiting somewhere else.
            </p>
          }
        >
          <div className="flex items-center">
            <RiHandCoinFill size={18} className="ml-2" />
            <span className="ml-1">
              {calculateDemand(company.demandScore, company.baseDemand)}
            </span>
            {showingProductionResults && (
              <span className="text-red-500"> -1</span>
            )}
          </div>
        </Tooltip>
        <Tooltip
          classNames={{ base: baseToolTipStyle }}
          className={tooltipStyle}
          content={
            <p className={tooltipParagraphStyle}>
              The amount of goods the company produces per operating round.
            </p>
          }
        >
          <div className="flex items-center">
            <RiBox2Fill size={18} className="ml-2" />
            <span className="ml-1">
              {calculateCompanySupply(
                company.supplyMax,
                company.supplyBase,
                company.supplyCurrent
              )}
            </span>
          </div>
        </Tooltip>
        <Tooltip
          classNames={{ base: baseToolTipStyle }}
          className={tooltipStyle}
          content={
            <div className="flex flex-col gap-2">
              <p className={tooltipParagraphStyle}>
                Throughput. The companies demand minus it&apos;s supply. The
                closer to zero, the more efficient the company is operating.
              </p>
            </div>
          }
        >
          <Popover backdrop="blur" className="max-w-[calc(100vw-20px)]">
            <PopoverTrigger>
              <div className="flex items-center cursor-pointer">
                <RiIncreaseDecreaseFill size={18} className="ml-2" />
                <div className="ml-1 flex">
                  <span>
                    {calculateDemand(company.demandScore, company.baseDemand) -
                      calculateCompanySupply(
                        company.supplyMax,
                        company.supplyBase,
                        company.supplyCurrent
                      )}
                  </span>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent>
              <ThroughputLegend />
            </PopoverContent>
          </Popover>
        </Tooltip>
        <Tooltip
          classNames={{ base: baseToolTipStyle }}
          className={tooltipStyle}
          content={
            <p className={tooltipParagraphStyle}>
              The cost to operate the company per operating round. This cost is
              tied to your company tier.
            </p>
          }
        >
          <div className="flex items-center col-span-2">
            <RiExpandUpDownFill size={18} className="ml-2" />
            <span className="ml-1">
              ${CompanyTierData[company.companyTier].operatingCosts}
            </span>
          </div>
        </Tooltip>
        <Tooltip
          classNames={{ base: baseToolTipStyle }}
          className={tooltipStyle}
          content={
            <p className={tooltipParagraphStyle}>
              The amount of actions a company may take per operating round.
            </p>
          }
        >
          <div className="flex items-center gap-1">
            <RiGovernmentFill size={18} className="ml-2" />
            <span>{CompanyTierData[company.companyTier].companyActions}</span>
          </div>
        </Tooltip>
        {company.hasLoan && (
          <Tooltip
            classNames={{ base: baseToolTipStyle }}
            className={tooltipStyle}
            content={
              <p className={tooltipParagraphStyle}>
                This company has taken a loan. The company must pay back the
                loan with 10% interest at a fixed rate of $
                {Math.floor(
                  (LOAN_AMOUNT + LOAN_AMOUNT * LOAN_INTEREST_RATE) *
                    LOAN_INTEREST_RATE
                )}{" "}
                per turn.
              </p>
            }
          >
            <div className="flex items-center col-span-2">
              <RiBankCard2Fill size={18} className="ml-2" />
              <span className="ml-1">
                $
                {Math.floor(
                  (LOAN_AMOUNT + LOAN_AMOUNT * LOAN_INTEREST_RATE) *
                    LOAN_INTEREST_RATE
                )}
              </span>
            </div>
          </Tooltip>
        )}
      </div>
      <Tooltip
        classNames={{ base: baseToolTipStyle }}
        className={tooltipStyle}
        content={
          <p className={tooltipParagraphStyle}>
            The research cards this company owns.
          </p>
        }
      >
        <div className="flex items-center">
          <Popover>
            <PopoverTrigger>
              <Button className="p-0 m-0" isIconOnly>
                <RiGlasses2Fill size={18} />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <CompanyResearchCards companyId={company.id} />
            </PopoverContent>
          </Popover>
        </div>
      </Tooltip>
    </div>
  );
};

const CompanyInfo = ({
  companyId,
  showBarChart,
  showingProductionResults,
  isMinimal,
}: {
  companyId: string;
  showBarChart?: boolean;
  showingProductionResults?: boolean;
  isMinimal?: boolean;
}) => {
  const { currentPhase, gameState } = useGame();
  const {
    data: company,
    isLoading: isLoadingCompany,
    refetch: refetchCompany,
  } = trpc.company.getCompanyWithSector.useQuery({ id: companyId });
  const { data: companyActions, isLoading: isLoadingCompanyActions } =
    trpc.companyAction.listCompanyActions.useQuery({
      where: { companyId },
    });
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  useEffect(() => {
    refetchCompany();
  }, [currentPhase?.id]);
  const companyHasPassiveAction = companyActions?.some(
    (action) => action.isPassive
  );
  if (isLoadingCompany || isLoadingCompanyActions) {
    return <div>Loading...</div>;
  }
  if (!company) {
    return <div>No company found</div>;
  }
  // Conditionally render ModernCompany for MODERN operation mechanics
  if (gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN) {
    return (
      <ModernCompany
        companyId={company.id}
        gameId={company.gameId}
        currentPhase={currentPhase?.id || 0}
        unitPrice={company.unitPrice}
        brandScore={company.brandScore}
      />
    );
  }
  return (
    <>
      <div className="flex flex-row gap-1 items-center h-full w-full">
        <div className="flex flex-col gap-1">
          <div className="flex flex-col gap-1">
            <div className="flex flex-start gap-1 items-center justify-between">
              <div className="flex items-center gap-1 text-base lg:text-lg font-bold">
                <RiBuilding3Fill size={18} />
                <span>{company.name} </span>
              </div>
            </div>
            <div className="flex gap-1">
              <span>{company.stockSymbol}</span>
              <Tooltip
                classNames={{ base: baseToolTipStyle }}
                className={tooltipStyle}
                content={
                  <p className={tooltipParagraphStyle}>
                    The current stock price
                  </p>
                }
              >
                <Popover>
                  <PopoverTrigger>
                    <div className="flex items-center gap-1 cursor-pointer">
                      <RiFundsFill size={20} />
                      <span>${company.currentStockPrice}</span>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent>
                    <CompanyLineChart companyId={company.id} />
                  </PopoverContent>
                </Popover>
              </Tooltip>
            </div>
            <div className="flex gap-1">
              <Popover backdrop="blur" className="max-w-[calc(100vw-20px)]">
                <PopoverTrigger>
                  <div className="flex items-center gap-1 cursor-pointer">
                    <RiStackFill size={20} />
                    <span>{company.companyTier}</span>
                  </div>
                </PopoverTrigger>
                <PopoverContent>
                  <CompanyTiers company={company} />
                </PopoverContent>
              </Popover>
              |
              <Tooltip
                classNames={{ base: baseToolTipStyle }}
                className={tooltipStyle}
                content={
                  <p className={tooltipParagraphStyle}>
                    The company status. INACTIVE companies have not yet floated.
                  </p>
                }
              >
                <span>{company.status}</span>
              </Tooltip>
            </div>
            <div className="flex flex-wrap gap-3">
              <Tooltip
                classNames={{ base: baseToolTipStyle }}
                className={tooltipStyle}
                content={
                  <p className={tooltipParagraphStyle}>
                    Unit Price of goods. Each consumer consumes one good per
                    operating round given the company meets supply and demand.
                  </p>
                }
              >
                <span className="flex items-center gap-1">
                  <RiPriceTag3Fill size={20} /> ${company.unitPrice}
                </span>
              </Tooltip>
              <Tooltip
                classNames={{ base: baseToolTipStyle }}
                className={tooltipStyle}
                content={
                  <p className={tooltipParagraphStyle}>
                    Corporate treasury or cash on hand.
                  </p>
                }
              >
                <div className="flex items-center gap-1" onClick={onOpen}>
                  <RiWallet3Fill size={20} /> <span>${company.cashOnHand}</span>
                </div>
              </Tooltip>
              {company.ipoAndFloatPrice && (
                <Tooltip
                  classNames={{ base: baseToolTipStyle }}
                  className={tooltipStyle}
                  content={
                    <p className={tooltipParagraphStyle}>
                      The initial public offering price.
                    </p>
                  }
                >
                  <div className={`flex items-center gap-1`}>
                    <span className="text-lg">IPO</span>
                    <span>${company.ipoAndFloatPrice}</span>
                  </div>
                </Tooltip>
              )}
              <Tooltip
                classNames={{ base: baseToolTipStyle }}
                className={tooltipStyle}
                content={
                  <p className={tooltipParagraphStyle}>
                    Company status, inactive companies have not yet been
                    floated.
                  </p>
                }
              >
                <div
                  className={`flex items-center gap-1 ${
                    company.status == CompanyStatus.ACTIVE
                      ? "text-green-500"
                      : company.status == CompanyStatus.INACTIVE
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {(company.status == CompanyStatus.INACTIVE ||
                    company.status == CompanyStatus.ACTIVE) && (
                    <>
                      <RiSailboatFill size={20} />
                      <span>{company.Sector.sharePercentageToFloat}%</span>
                    </>
                  )}
                </div>
              </Tooltip>
              {companyHasPassiveAction && (
                <PassiveEffect
                  passiveEffect={
                    SectorEffects[company.Sector.sectorName].passive
                  }
                  sectorName={company.Sector.name}
                />
              )}
            </div>
          </div>
          {isMinimal ? (
            <Accordion>
              <AccordionItem
                key="more-info"
                aria-label="More Information"
                title="More Information"
              >
                <CompanyMoreInfo
                  company={company}
                  showingProductionResults={showingProductionResults}
                />
              </AccordionItem>
            </Accordion>
          ) : (
            <CompanyMoreInfo
              company={company}
              showingProductionResults={showingProductionResults}
            />
          )}
          <div className="flex flex-col justify-center items-center">
            {showBarChart && (
              <div className="flex gap-1 justify-between">
                {buildBarChart(company.Share)}
              </div>
            )}
          </div>
        </div>
      </div>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="dark bg-slate-900 text-foreground h-full"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex flex-col gap-2 justify-center text-center">
                  <div>{company.name} Transaction History</div>
                </div>
              </ModalHeader>
              <ModalBody className="overflow-auto">
                <MoneyTransactionHistoryByCompany company={company} />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default CompanyInfo;
