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
  RiPriceTag3Fill,
  RiSailboatFill,
  RiShapesFill,
  RiSparkling2Fill,
  RiStackFill,
  RiTeamFill,
  RiUserFill,
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
  Share,
  ShareLocation,
} from "@server/prisma/prisma.client";
import {
  CompanyWithSector,
  ShareWithPlayer,
} from "@server/prisma/prisma.types";
import { BarList, LineChart } from "@tremor/react";
import ThroughputLegend from "../../Game/ThroughputLegend";
import { trpc } from "@sectors/app/trpc";
import CompanyTiers from "../CompanyTiers";
import { MoneyTransactionHistoryByCompany } from "../../Game/MoneyTransactionHistory";
import { useGame } from "../../Game/GameContext";
import { useEffect } from "react";
import { renderLocationShortHand } from "@sectors/app/helpers";
import PlayerAvatar from "../../Player/PlayerAvatar";
import { CompanyLineChart } from "../CompanyLineChart";
import CompanyResearchCards from "../CompanyResearchCards";
import { ModernCompany } from "./ModernCompany";
import ShareComponent from "../Share";
import { MarketingSlots } from "../Tableau/MarketingSlots";
import ShareHolders from "../ShareHolders";

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
                    Historical sector demand value. Both consumer distribution and worker salaries are now determined by Forecast rankings (from share commitments to forecast quarters).
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

  const { data: researchProgress } = trpc.modernOperations.getSectorResearchProgress.useQuery(
    {
      sectorId: company?.sectorId || '',
      gameId,
    },
    { enabled: !!company?.sectorId }
  );

  // Get research workers count (each research order = 1 worker)
  const { data: researchWorkers = 0 } = trpc.modernOperations.getResearchWorkers.useQuery(
    {
      companyId,
      gameId,
    },
    { enabled: !!companyId && !!gameId }
  );

  const researchProgressValue = company?.researchProgress || 0;
  // Calculate research stage from researchMarker (0-3 = Stage 1, 4-6 = Stage 2, 7-9 = Stage 3, 10-12+ = Stage 4)
  const researchMarker = company?.Sector?.researchMarker || 0;
  let researchStage = 1;
  if (researchMarker >= 10) {
    researchStage = 4;
  } else if (researchMarker >= 7) {
    researchStage = 3;
  } else if (researchMarker >= 4) {
    researchStage = 2;
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="text-sm text-gray-400">
        Company Progress: <span className="text-blue-300 font-medium">{researchProgressValue}</span> spaces
      </div>
      {researchWorkers > 0 && (
        <div className="text-sm text-gray-400">
          Workers: <span className="text-blue-300 font-medium">{researchWorkers}</span>
        </div>
      )}
      {researchMarker > 0 && (
        <div className="text-sm text-gray-400">
          Sector Research Stage: <span className="text-blue-300 font-medium">{researchStage}</span> (Marker: {researchMarker})
        </div>
      )}
      {(researchProgressValue >= 5 || researchProgressValue >= 10) && (
        <div className="text-xs text-green-400 mt-2">
          {researchProgressValue >= 10 && '✓ Grant at 5 • '}
          {researchProgressValue >= 10 && '✓ Market Favor at 10'}
        </div>
      )}
    </div>
  );
};

const CompanyInfoV2 = ({
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
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1">
                <RiVipCrown2Fill size={20} />
                <PlayerAvatar player={ceoPlayer as Player} size="sm" showNameLabel />
              </div>
              <Popover placement="top">
                <PopoverTrigger>
                  <button className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
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
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-row gap-1 items-start h-full w-full">
        <div className="flex flex-col gap-1 flex-1">
          {/* Condensed Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-base lg:text-lg font-bold">
              <RiBuilding3Fill size={18} />
              <span>{company.name}</span>
            </div>
            {companyPriority && (companyPriority.global || companyPriority.sector) && (
              <div className="flex items-center gap-1">
                {companyPriority.global && (
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
                {companyPriority.sector && (
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
              <span className="text-base text-gray-400">{company.stockSymbol}</span>
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
            {company.ipoAndFloatPrice && (
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
            {ceoPlayer && (
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1">
                  <RiVipCrown2Fill size={18} />
                  <PlayerAvatar player={ceoPlayer as Player} size="sm" showNameLabel />
                </div>
                <Popover placement="top">
                  <PopoverTrigger>
                    <button className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
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
          </div>

          {!isMinimal && (
            <div className="mt-1">
              <CompanyMoreInfo
                company={company}
                showingProductionResults={showingProductionResults}
              />
            </div>
          )}

          {showBarChart && (
            <div className="flex gap-1 justify-between mt-1">
              {buildBarChart(company.Share)}
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
