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
  RiGlasses2Fill,
  RiGovernmentFill,
  RiHandCoinFill,
  RiIncreaseDecreaseFill,
  RiInformationLine,
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
import { ModernCompany } from "./CompanyV2/ModernCompany";

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
          <Popover placement="top">
            <PopoverTrigger>
              <button type="button" className="flex items-center cursor-pointer bg-transparent border-none text-inherit">
                <RiHandCoinFill size={18} className="ml-2" />
                <span className="ml-1">
                  {company.Sector.demand + (company.Sector.demandBonus || 0)}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className={tooltipStyle}>
              <p className={tooltipParagraphStyle}>
                Sector demand is based on brand score (from marketing) and research slot bonuses. Consumer distribution and worker salaries are determined by sector demand rankings (1st: 50% economy score, 2nd: 30%, 3rd: 20%).
              </p>
            </PopoverContent>
          </Popover>
          <Popover placement="top">
            <PopoverTrigger>
              <button type="button" className="flex items-center cursor-pointer bg-transparent border-none text-inherit">
                <RiTeamFill size={18} className="ml-2" />
                <span className="ml-1">{company.Sector.consumers}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className={tooltipStyle}>
              <p className={tooltipParagraphStyle}>
                The amount of consumers currently looking to buy in this sector.
              </p>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="flex flex-wrap items-center">
        {/* Prestige removed - not used in modern game */}
        <Popover placement="top">
          <PopoverTrigger>
            <button type="button" className="flex items-center cursor-pointer bg-transparent border-none text-inherit">
              <RiHandCoinFill size={18} className="ml-2" />
              <span className="ml-1">
                {calculateDemand(company.demandScore, company.baseDemand)}
              </span>
              {showingProductionResults && (
                <span className="text-red-500"> -1</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className={tooltipStyle}>
            <p className={tooltipParagraphStyle}>
              The companies demand score. The maximum amount of customers that
              will visit your company before visiting somewhere else.
            </p>
          </PopoverContent>
        </Popover>
        <Popover placement="top">
          <PopoverTrigger>
            <button type="button" className="flex items-center cursor-pointer bg-transparent border-none text-inherit">
              <RiBox2Fill size={18} className="ml-2" />
              <span className="ml-1">
                {calculateCompanySupply(
                  company.supplyMax,
                  company.supplyBase,
                  company.supplyCurrent
                )}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className={tooltipStyle}>
            <p className={tooltipParagraphStyle}>
              The amount of goods the company produces per operating round.
            </p>
          </PopoverContent>
        </Popover>
        <Popover backdrop="blur" className="max-w-[calc(100vw-20px)]" placement="top">
          <PopoverTrigger>
            <button type="button" className="flex items-center cursor-pointer bg-transparent border-none text-inherit">
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
            </button>
          </PopoverTrigger>
          <PopoverContent>
            <ThroughputLegend />
          </PopoverContent>
        </Popover>
        <Popover placement="top">
          <PopoverTrigger>
            <button type="button" className="flex items-center col-span-2 cursor-pointer bg-transparent border-none text-inherit">
              <RiExpandUpDownFill size={18} className="ml-2" />
              <span className="ml-1">
                ${CompanyTierData[company.companyTier].operatingCosts}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className={tooltipStyle}>
            <p className={tooltipParagraphStyle}>
              The cost to operate the company per operating round. This cost is
              tied to your company tier.
            </p>
          </PopoverContent>
        </Popover>
        <Popover placement="top">
          <PopoverTrigger>
            <button type="button" className="flex items-center gap-1 cursor-pointer bg-transparent border-none text-inherit">
              <RiGovernmentFill size={18} className="ml-2" />
              <span>{CompanyTierData[company.companyTier].companyActions}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className={tooltipStyle}>
            <p className={tooltipParagraphStyle}>
              The amount of actions a company may take per operating round.
            </p>
          </PopoverContent>
        </Popover>
        {company.hasLoan && (
          <Popover placement="top">
            <PopoverTrigger>
              <button type="button" className="flex items-center col-span-2 cursor-pointer bg-transparent border-none text-inherit">
                <RiBankCard2Fill size={18} className="ml-2" />
                <span className="ml-1">
                  $
                  {Math.floor(
                    (LOAN_AMOUNT + LOAN_AMOUNT * LOAN_INTEREST_RATE) *
                      LOAN_INTEREST_RATE
                  )}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className={tooltipStyle}>
              <p className={tooltipParagraphStyle}>
                This company has taken a loan. The company must pay back the
                loan with 10% interest at a fixed rate of $
                {Math.floor(
                  (LOAN_AMOUNT + LOAN_AMOUNT * LOAN_INTEREST_RATE) *
                    LOAN_INTEREST_RATE
                )}{" "}
                per turn.
              </p>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <Popover placement="top">
        <PopoverTrigger>
          <Button className="p-0 m-0" isIconOnly aria-label="Research cards">
            <RiGlasses2Fill size={18} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={tooltipStyle}>
          <p className={tooltipParagraphStyle}>
            The research cards this company owns.
          </p>
          <CompanyResearchCards companyId={company.id} />
        </PopoverContent>
      </Popover>
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
  }, [currentPhase?.id, refetchCompany]);
  const companyHasPassiveAction = companyActions?.some(
    (action) => action.isPassive
  );
  if (isLoadingCompany || isLoadingCompanyActions) {
    return <div>Loading...</div>;
  }
  if (!company) {
    return <div>No company found</div>;
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
              <Popover placement="top">
                <PopoverTrigger>
                  <button type="button" className="flex items-center gap-1 cursor-pointer bg-transparent border-none text-inherit">
                    <RiFundsFill size={20} />
                    <span>${company.currentStockPrice}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent>
                  <p className={tooltipParagraphStyle}>
                    The current stock price
                  </p>
                  <CompanyLineChart companyId={company.id} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-1">
              <Popover backdrop="blur" className="max-w-[calc(100vw-20px)]" placement="top">
                <PopoverTrigger>
                  <button type="button" className="flex items-center gap-1 cursor-pointer bg-transparent border-none text-inherit">
                    <RiStackFill size={20} />
                    <span>{company.companyTier}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent>
                  <CompanyTiers company={company} />
                </PopoverContent>
              </Popover>
              |
              <Popover placement="top">
                <PopoverTrigger>
                  <button type="button" className="cursor-pointer bg-transparent border-none text-inherit">
                    {company.status}
                  </button>
                </PopoverTrigger>
                <PopoverContent className={tooltipStyle}>
                  <p className={tooltipParagraphStyle}>
                    The company status. INACTIVE companies have not yet floated.
                  </p>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-wrap gap-3">
              <Popover placement="top">
                <PopoverTrigger>
                  <button type="button" className="flex items-center gap-1 cursor-pointer bg-transparent border-none text-inherit">
                    <RiPriceTag3Fill size={20} /> ${company.unitPrice}
                  </button>
                </PopoverTrigger>
                <PopoverContent className={tooltipStyle}>
                  <p className={tooltipParagraphStyle}>
                    Unit Price of goods. Each consumer consumes one good per
                    operating round given the company meets supply and demand.
                  </p>
                </PopoverContent>
              </Popover>
              <div className="flex items-center gap-1">
                <button type="button" className="flex items-center gap-1 cursor-pointer bg-transparent border-none text-inherit" onClick={onOpen}>
                  <RiWallet3Fill size={20} /> <span>${company.cashOnHand}</span>
                </button>
                <Popover placement="top">
                  <PopoverTrigger>
                    <button type="button" className="cursor-pointer bg-transparent border-none text-inherit p-0" aria-label="Cash on hand info">
                      <RiGameFill size={14} className="text-default-400 hover:text-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className={tooltipStyle}>
                    <p className={tooltipParagraphStyle}>
                      Corporate treasury or cash on hand.
                    </p>
                  </PopoverContent>
                </Popover>
              </div>
              {company.ipoAndFloatPrice && (
                <Popover placement="top">
                  <PopoverTrigger>
                    <button type="button" className="flex items-center gap-1 cursor-pointer bg-transparent border-none text-inherit">
                      <span className="text-lg">IPO</span>
                      <span>${company.ipoAndFloatPrice}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className={tooltipStyle}>
                    <p className={tooltipParagraphStyle}>
                      The initial public offering price.
                    </p>
                  </PopoverContent>
                </Popover>
              )}
              <Popover placement="top">
                <PopoverTrigger>
                  <button
                    type="button"
                    className={`flex items-center gap-1 cursor-pointer bg-transparent border-none text-inherit ${
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
                  </button>
                </PopoverTrigger>
                <PopoverContent className={tooltipStyle}>
                  <p className={tooltipParagraphStyle}>
                    Company status, inactive companies have not yet been
                    floated.
                  </p>
                </PopoverContent>
              </Popover>
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
