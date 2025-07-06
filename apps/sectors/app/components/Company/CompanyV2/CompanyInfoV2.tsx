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

  if (isMinimal) {
    return (
      <div className="flex flex-col gap-2 p-2">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span>{company.name}</span>
          <div className="flex gap-1">
            <span>{company.stockSymbol}</span>
            <Tooltip
              classNames={{ base: baseToolTipStyle }}
              className={tooltipStyle}
              content={
                <p className={tooltipParagraphStyle}>The current stock price</p>
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
        </div>

        <div className="flex gap-1">
          <Tooltip
            classNames={{ base: baseToolTipStyle }}
            className={tooltipStyle}
            content={
              <p className={tooltipParagraphStyle}>
                The company status. INACTIVE companies have not yet floated.
              </p>
            }
          >
            <span className={
              company.status == CompanyStatus.ACTIVE ? "text-green-500" : company.status == CompanyStatus.INACTIVE ? "text-yellow-500" : "text-red-500"
            }>{company.status}</span>
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
        </div>
      </div>
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
                <span>{company.name} v2 </span>
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
            <div className="flex gap-1 justify-between items-center">
              <div className="flex flex-col gap-1">
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
                    <RiWallet3Fill size={20} />{" "}
                    <span>${company.cashOnHand}</span>
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
              </div>
              <div>
                {isMinimal ? null : (
                  <CompanyMoreInfo
                    company={company}
                    showingProductionResults={showingProductionResults}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center items-center">
            {showBarChart && (
              <div className="flex gap-1 justify-between">
                {buildBarChart(company.Share)}
              </div>
            )}
          </div>
        </div>
      </div>
      <ModernCompany
        companyId={company.id}
        gameId={company.gameId}
        currentPhase={Number(currentPhase?.id || 0)}
      />
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
