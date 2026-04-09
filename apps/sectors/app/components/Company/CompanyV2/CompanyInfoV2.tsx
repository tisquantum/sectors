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
  RiInformationLine,
  RiMegaphoneFill,
  RiFlaskFill,
  RiPriceTag3Fill,
  RiSailboatFill,
  RiShapesFill,
  RiSparkling2Fill,
  RiStackFill,
  RiTeamFill,
  RiWallet3Fill,
  RiVipCrown2Fill,
  RiHashtag,
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
} from "@server/prisma/prisma.client";
import { CompanyWithSector } from "@server/prisma/prisma.types";
import { BarList, LineChart } from "@tremor/react";
import ThroughputLegend from "../../Game/ThroughputLegend";
import { trpc } from "@sectors/app/trpc";
import CompanyTiers from "../CompanyTiers";
import { MoneyTransactionHistoryByCompany } from "../../Game/MoneyTransactionHistory";
import { useGame } from "../../Game/GameContext";
import { useEffect } from "react";
import PlayerAvatar from "../../Player/PlayerAvatar";
import { CompanyLineChart } from "../CompanyLineChart";
import CompanyResearchCards from "../CompanyResearchCards";
import { ModernCompany } from "./ModernCompany";
import { MarketingSlots } from "../Tableau/MarketingSlots";
import ShareHolders from "../ShareHolders";

const CompanyMoreInfo = ({
  company,
  showingProductionResults,
}: {
  company: CompanyWithSector;
  showingProductionResults?: boolean;
}) => {
  return (
    <div className="flex gap-1">
      <div
        className="flex flex-col px-2 rounded-md"
        style={{ backgroundColor: sectorColors[company.Sector.name] }}
      >
        <div className="flex items-center gap-1">
          <RiShapesFill size={18} />
          <span>{company.Sector.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1">
            <RiHandCoinFill size={18} className="ml-2" />
            <span className="ml-1">
              {company.Sector.demand + (company.Sector.demandBonus || 0)}
            </span>
            <Popover placement="top">
              <PopoverTrigger>
                <button className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
                  <RiInformationLine size={14} />
                </button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="px-1 py-1 max-w-xs">
                  <div className="text-small font-semibold mb-1">Sector Demand</div>
                  <div className="text-small text-default-500">
                    Sector demand is research slot bonuses plus demand bonuses from active marketing campaigns (tier I +1, tier II +1, tier III +2 each while active). Brand score does not affect sector demand. Consumer distribution and worker salaries follow sector demand rankings (1st: 50% economy score, 2nd: 30%, 3rd: 20%).
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-1">
            <RiTeamFill size={18} className="ml-2" />
            <span className="ml-1">{company.Sector.consumers}</span>
            <Popover placement="top">
              <PopoverTrigger>
                <button className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
                  <RiInformationLine size={14} />
                </button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="px-1 py-1 max-w-xs">
                  <div className="text-small font-semibold mb-1">Consumers</div>
                  <div className="text-small text-default-500">
                    The amount of consumers currently looking to buy in this sector.
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
      <ShareHolders companyId={company.id} isMinimal/>
    </div>
  );
};

const MarketingCampaignInfo = ({ companyId, gameId }: { companyId: string; gameId: string }) => {
  const { data: campaigns } = trpc.marketing.getCompanyCampaigns.useQuery({
    companyId,
    gameId,
  });
  const { data: totalBrandBonus } = trpc.marketing.getTotalBrandBonus.useQuery({
    companyId,
    gameId,
  });

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="text-sm text-gray-400 mt-2">
        No active marketing campaigns
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="text-sm text-gray-400">
        <span className="text-purple-300 font-medium">{campaigns.length}</span> active campaign{campaigns.length !== 1 ? 's' : ''}
        {' • '}
        <span className="text-purple-300 font-medium">+{totalBrandBonus || 0}</span> total brand bonus
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="px-2 py-1 rounded bg-purple-400/20 border border-purple-400/40 text-gray-300"
          >
            Tier {campaign.tier.replace('TIER_', '')}: +{campaign.brandBonus} brand
            {campaign.status === 'DECAYING' && (
              <span className="text-yellow-400 ml-1">(Decaying)</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ResearchInfo = ({ companyId, gameId }: { companyId: string; gameId: string }) => {
  const { data: company } = trpc.company.getCompanyWithSector.useQuery({
    id: companyId,
  });

  const { data: researchWorkers = 0 } = trpc.modernOperations.getResearchWorkers.useQuery(
    {
      companyId,
      gameId,
    },
    { enabled: !!companyId && !!gameId }
  );

  const lifetimeContribution = company?.researchProgress || 0;
  const researchMarker = company?.Sector?.researchMarker ?? 0;
  let researchStage = 1;
  if (researchMarker >= 10) {
    researchStage = 4;
  } else if (researchMarker >= 7) {
    researchStage = 3;
  } else if (researchMarker >= 4) {
    researchStage = 2;
  }

  const grants = company?.researchGrants ?? 0;
  const favors = company?.marketFavors ?? 0;

  return (
    <div className="mt-2 space-y-2">
      <div className="text-sm text-gray-400">
        Shared sector track:{' '}
        <span className="text-blue-300 font-medium">{researchMarker}</span>/12
        <span className="text-gray-500"> (stage {researchStage})</span>
      </div>
      <div className="text-sm text-gray-400">
        Research workers (this company):{' '}
        <span className="text-blue-300 font-medium">{researchWorkers}</span>
      </div>
      <div className="text-sm text-gray-400">
        Lifetime spaces paid for by this company:{' '}
        <span className="text-blue-300 font-medium">+{lifetimeContribution}</span>
        <span className="block text-xs text-gray-500 mt-0.5">
          Cash for each action comes from this company; +1 or +2 advances the sector track for everyone.
        </span>
      </div>
      {(lifetimeContribution >= 5 || grants > 0 || favors > 0) && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>
            Per-company milestones use your running total: grant at 5 spaces, market favor at 10.
          </p>
          {grants > 0 && (
            <p className="text-green-400">Research grants earned: {grants}</p>
          )}
          {favors > 0 && (
            <p className="text-purple-400">Market favors: {favors}</p>
          )}
        </div>
      )}
    </div>
  );
};

const CompanyInfoV2 = ({
  companyId,
  showingProductionResults,
  isMinimal,
}: {
  companyId: string;
  showingProductionResults?: boolean;
  isMinimal?: boolean;
}) => {
  const { currentPhase, gameState, authPlayer } = useGame();
  const {
    data: company,
    isLoading: isLoadingCompany,
    refetch: refetchCompany,
  } = trpc.company.getCompanyWithSector.useQuery({ id: companyId });
  const { data: companyActions, isLoading: isLoadingCompanyActions } =
    trpc.companyAction.listCompanyActions.useQuery({
      where: { companyId },
    });
  // Fetch CEO player info
  const { data: ceoPlayer } = trpc.player.getPlayer.useQuery(
    { where: { id: company?.ceoId || "" } },
    { enabled: !!company?.ceoId }
  );
  // Fetch company priority (global and sector)
  const { data: companyPriority } = trpc.company.getCompanyPriority.useQuery(
    { companyId, gameId: company?.gameId || "" },
    { enabled: !!company?.gameId && !!companyId }
  );
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

  if (isMinimal) {
    return (
      <div className="flex flex-col gap-2 p-2">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span>{company.name}</span>
          <div className="flex gap-1">
            <span>{company.stockSymbol}</span>
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
          </div>
        </div>

        <div className="flex gap-1 flex-wrap">
          <div className="flex items-center gap-1">
            <span
              className={
                company.status == CompanyStatus.ACTIVE
                  ? "text-green-500"
                  : company.status == CompanyStatus.INACTIVE
                  ? "text-yellow-500"
                  : "text-red-500"
              }
            >
              {company.status}
            </span>
            <Popover placement="top">
              <PopoverTrigger>
                <button className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
                  <RiInformationLine size={14} />
                </button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="px-1 py-1 max-w-xs">
                  <div className="text-small font-semibold mb-1">Company Status</div>
                  <div className="text-small text-default-500">
                    The company status. INACTIVE companies have not yet floated.
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {(company.status == CompanyStatus.INACTIVE ||
            company.status == CompanyStatus.ACTIVE) && (
            <div className="flex items-center gap-1">
              <div
                className={`flex items-center gap-1 ${
                  company.status == CompanyStatus.ACTIVE
                    ? "text-green-500"
                    : company.status == CompanyStatus.INACTIVE
                    ? "text-yellow-500"
                    : "text-red-500"
                }`}
              >
                <RiSailboatFill size={20} />
                <span>{company.Sector.sharePercentageToFloat}%</span>
              </div>
              <Popover placement="top">
                <PopoverTrigger>
                  <button className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
                    <RiInformationLine size={14} />
                  </button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="px-1 py-1 max-w-xs">
                    <div className="text-small font-semibold mb-1">Float Percentage</div>
                    <div className="text-small text-default-500">
                      Share percentage required to float companies in this sector.
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1" onClick={onOpen}>
              <RiWallet3Fill size={20} /> <span>${company.cashOnHand}</span>
            </div>
            <Popover placement="top">
              <PopoverTrigger>
                <button className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
                  <RiInformationLine size={14} />
                </button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="px-1 py-1 max-w-xs">
                  <div className="text-small font-semibold mb-1">Cash on Hand</div>
                  <div className="text-small text-default-500">
                    Corporate treasury or cash on hand.
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {ceoPlayer && (
            <div className="flex items-center gap-1 shrink-0">
              <div className="flex items-center gap-1.5">
                <RiVipCrown2Fill size={20} className="shrink-0 text-amber-400/90" />
                <PlayerAvatar player={ceoPlayer as Player} size="sm" showNameLabel />
              </div>
              <Popover placement="top">
                <PopoverTrigger>
                  <button className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer shrink-0">
                    <RiInformationLine size={14} />
                  </button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="px-1 py-1 max-w-xs">
                    <div className="text-small font-semibold mb-1">CEO</div>
                    <div className="text-small text-default-500">
                      The CEO (Chief Executive Officer) of this company.
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
          <Popover placement="top" showArrow>
            <PopoverTrigger>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/35 bg-cyan-950/35 px-2 py-1 text-xs text-cyan-50 hover:bg-cyan-900/45 transition-colors shrink-0"
                aria-label={`Sector research track ${company.Sector.researchMarker}, open details`}
              >
                <RiFlaskFill size={16} className="text-cyan-400 shrink-0" />
                <span className="font-medium tabular-nums">
                  {company.Sector.researchMarker}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="max-w-xs">
              <div className="px-1 py-1">
                <div className="text-small font-semibold mb-1 flex items-center gap-2">
                  <RiFlaskFill size={18} className="text-cyan-400 shrink-0" />
                  Sector research track
                </div>
                <p className="text-small text-default-500">
                  One 12-space track per sector, shared by all companies there. This number is the
                  sector position (not per company). Higher markers unlock stages, factory and
                  marketing slots, and sector demand bonuses in modern operations.
                </p>
              </div>
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/20 border border-purple-400/50">
              <RiMegaphoneFill size={16} className="text-purple-400" />
              <span className="text-sm font-medium">{company.brandScore ?? 0}</span>
            </div>
            <Popover placement="top">
              <PopoverTrigger>
                <button className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer" aria-label="Brand score info">
                  <RiInformationLine size={14} />
                </button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="px-1 py-1 max-w-xs">
                  <div className="text-small font-semibold mb-1">Brand Score</div>
                  <div className="text-small text-default-500">
                    Increased by marketing campaigns. Higher brand improves attraction (lowers effective price). Per factory: product unit price (sum of resource prices) − brand score.
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-row gap-1 items-start h-full w-full">
        <div className="flex flex-col gap-1 flex-1">
          {/* Condensed Header - 3 Rows */}
          <div className="flex flex-col gap-1">
            {/* Row 1: NAME SECTOR NAME STOCK PRICE IPO PRICE */}
            <div className="flex items-center gap-1 flex-wrap">
              <div className="flex items-center gap-1 text-base lg:text-lg font-bold">
                <RiBuilding3Fill size={18} />
                <span>{company.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <RiShapesFill size={18} />
                <span className="text-base">{company.Sector.name}</span>
              </div>
              {company.ipoAndFloatPrice != null &&
              company.currentStockPrice === company.ipoAndFloatPrice ? (
                <Popover>
                  <PopoverTrigger>
                    <div className="flex items-center gap-1 cursor-pointer text-base">
                      <RiFundsFill size={18} />
                      <span>${company.currentStockPrice}</span>
                      <span className="text-xs font-normal text-gray-400">
                        (IPO / float)
                      </span>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="px-1 py-1 max-w-xs mb-2 text-small text-default-500">
                      Stock price matches IPO and float price.
                    </div>
                    <CompanyLineChart companyId={company.id} />
                  </PopoverContent>
                </Popover>
              ) : (
                <>
                  <div className="flex items-center gap-1">
                    <Popover>
                      <PopoverTrigger>
                        <div className="flex items-center gap-1 cursor-pointer">
                          <RiFundsFill size={18} />
                          <span className="text-base">${company.currentStockPrice}</span>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent>
                        <CompanyLineChart companyId={company.id} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  {company.ipoAndFloatPrice != null && (
                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-1 text-base">
                        <span>IPO</span>
                        <span>${company.ipoAndFloatPrice}</span>
                      </div>
                      <Popover placement="top">
                        <PopoverTrigger>
                          <button className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
                            <RiInformationLine size={14} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <div className="px-1 py-1 max-w-xs">
                            <div className="text-small font-semibold mb-1">IPO Price</div>
                            <div className="text-small text-default-500">
                              The initial public offering price.
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Row 2: PRIORITY NUMBERS ACTIVE STATUS FLOAT STATUS CASH ON HAND */}
            <div className="flex items-center gap-1 flex-wrap">
              {companyPriority &&
                (companyPriority.global != null ||
                  companyPriority.sector != null) && (
                <div className="flex items-center gap-1">
                  {companyPriority.global != null && (
                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-1 px-2 py-1 rounded bg-gray-700/50 border border-gray-600">
                        <RiHashtag size={16} />
                        <span className="text-base font-semibold">{companyPriority.global}</span>
                      </div>
                      <Popover placement="top">
                        <PopoverTrigger>
                          <button className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
                            <RiInformationLine size={14} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <div className="px-1 py-1 max-w-xs">
                            <div className="text-small font-semibold mb-1">Global Priority</div>
                            <div className="text-small text-default-500">
                              Global company priority based on stock price (highest to lowest), then stacking order across all sectors.
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                  {companyPriority.sector != null && (
                    <div className="flex items-center gap-1">
                      <div
                        className="flex items-center gap-1 px-2 py-1 rounded border"
                        style={{
                          backgroundColor: company?.Sector ? `${sectorColors[company.Sector.name]}80` : 'rgba(59, 130, 246, 0.5)',
                          borderColor: company?.Sector ? sectorColors[company.Sector.name] : 'rgb(37, 99, 235)',
                        }}
                      >
                        <RiHashtag size={16} />
                        <span className="text-base font-semibold">{companyPriority.sector}</span>
                      </div>
                      <Popover placement="top">
                        <PopoverTrigger>
                          <button className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
                            <RiInformationLine size={14} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <div className="px-1 py-1 max-w-xs">
                            <div className="text-small font-semibold mb-1">Sector Priority</div>
                            <div className="text-small text-default-500">
                              Sector company priority based on stock price (highest to lowest), then stacking order within this sector.
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1">
                <span className={`text-base ${
                  company.status == CompanyStatus.ACTIVE
                    ? "text-green-500"
                    : company.status == CompanyStatus.INACTIVE
                    ? "text-yellow-500"
                    : "text-red-500"
                }`}>
                  {company.status}
                </span>
                <Popover placement="top">
                  <PopoverTrigger>
                    <button className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
                      <RiInformationLine size={14} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="px-1 py-1 max-w-xs">
                      <div className="text-small font-semibold mb-1">Company Status</div>
                      <div className="text-small text-default-500">
                        The company status. INACTIVE companies have not yet floated.
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              {(company.status == CompanyStatus.INACTIVE ||
                company.status == CompanyStatus.ACTIVE) && (
                <div className="flex items-center gap-1">
                  <div className={`flex items-center gap-1 text-base ${
                    company.status == CompanyStatus.ACTIVE
                      ? "text-green-500"
                      : company.status == CompanyStatus.INACTIVE
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}>
                    <RiSailboatFill size={18} />
                    <span>{company.Sector.sharePercentageToFloat}%</span>
                  </div>
                  <Popover placement="top">
                    <PopoverTrigger>
                      <button className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
                        <RiInformationLine size={14} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <div className="px-1 py-1 max-w-xs">
                        <div className="text-small font-semibold mb-1">Float Percentage</div>
                        <div className="text-small text-default-500">
                          Share percentage required to float companies in this sector.
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 cursor-pointer" onClick={onOpen}>
                  <RiWallet3Fill size={18} />
                  <span className="text-base">${company.cashOnHand}</span>
                </div>
                <Popover placement="top">
                  <PopoverTrigger>
                    <button className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
                      <RiInformationLine size={14} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="px-1 py-1 max-w-xs">
                      <div className="text-small font-semibold mb-1">Cash on Hand</div>
                      <div className="text-small text-default-500">
                        Corporate treasury or cash on hand.
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Row 3: CEO | Rewards (sector research) | Brand score */}
            <div className="flex items-center gap-2 flex-wrap">
              {ceoPlayer && (
                <div className="flex items-center gap-1 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <RiVipCrown2Fill size={18} className="shrink-0 text-amber-400/90" />
                    <PlayerAvatar player={ceoPlayer as Player} size="sm" showNameLabel />
                  </div>
                  <Popover placement="top">
                    <PopoverTrigger>
                      <button className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer shrink-0">
                        <RiInformationLine size={14} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <div className="px-1 py-1 max-w-xs">
                        <div className="text-small font-semibold mb-1">CEO</div>
                        <div className="text-small text-default-500">
                          The CEO (Chief Executive Officer) of this company.
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              <Popover placement="top" showArrow>
                <PopoverTrigger>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/35 bg-cyan-950/35 px-2 py-1 text-xs text-cyan-50 hover:bg-cyan-900/45 transition-colors shrink-0"
                    aria-label={`Sector research track ${company.Sector.researchMarker}, open details`}
                  >
                    <RiFlaskFill size={16} className="text-cyan-400 shrink-0" />
                    <span className="font-medium tabular-nums">
                      {company.Sector.researchMarker}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="max-w-xs">
                  <div className="px-1 py-1">
                    <div className="text-small font-semibold mb-1 flex items-center gap-2">
                      <RiFlaskFill size={18} className="text-cyan-400 shrink-0" />
                      Sector research track
                    </div>
                    <p className="text-small text-default-500">
                      One 12-space track per sector, shared by all companies there. This number is
                      the sector position (not per company). Higher markers unlock stages,
                      factory and marketing slots, and sector demand bonuses in modern operations.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
              {/* Brand score */}
              <div className="flex items-center gap-1 shrink-0">
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-purple-500/20 border border-purple-400/50">
                  <RiMegaphoneFill size={16} className="text-purple-400" />
                  <span className="text-base font-medium">{company.brandScore ?? 0}</span>
                </div>
                <Popover placement="top">
                  <PopoverTrigger>
                    <button className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer" aria-label="Brand score info">
                      <RiInformationLine size={14} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="px-1 py-1 max-w-xs">
                      <div className="text-small font-semibold mb-1">Brand Score</div>
                      <div className="text-small text-default-500">
                        Increased by marketing campaigns. Brand score lowers effective attraction per factory (product unit price − brand score); shown on each factory card.
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {!isMinimal && (
            <div className="mt-1">
              <CompanyMoreInfo
                company={company}
                showingProductionResults={showingProductionResults}
              />
            </div>
          )}

          {/* Operations Accordion */}
          <Accordion className="mt-1">
            <AccordionItem
              key="operations"
              aria-label="Operations"
              title={
                <div className="flex items-center gap-2">
                  <RiSparkling2Fill size={18} />
                  <span>Operations</span>
                </div>
              }
            >
              <ModernCompany
                companyId={company.id}
                gameId={company.gameId}
                currentPhase={currentPhase?.id}
                isCEO={company.ceoId === authPlayer?.id}
              />
            </AccordionItem>
          </Accordion>
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

export default CompanyInfoV2;
