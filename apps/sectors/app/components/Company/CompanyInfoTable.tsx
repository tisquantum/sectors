import React, { useState } from "react";
import {
  CompanyWithRelations,
  CompanyWithSector,
  PlayerOrderConcealedWithPlayer,
  PlayerOrderWithPlayerCompany,
  PlayerOrderWithPlayerRevealed,
} from "@server/prisma/prisma.types";
import {
  RiFundsFill,
  RiPriceTag3Fill,
  RiWallet3Fill,
  RiHandCoinFill,
  RiExpandUpDownFill,
  RiGovernmentFill,
  RiBankCard2Fill,
  RiSailboatFill,
  RiTeamFill,
  RiFundsBoxFill,
  RiCurrencyFill,
  RiMegaphoneFill,
  RiFlaskFill,
  RiStackFill,
  RiErrorWarningFill,
} from "@remixicon/react";
import {
  CompanyTierData,
  LOAN_AMOUNT,
  LOAN_INTEREST_RATE,
} from "@server/data/constants";
import { calculateDemand } from "@server/data/helpers";
import { sectorColors } from "@server/data/gameData";
import DebounceButton from "../General/DebounceButton";
import {
  AvatarGroup,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  TableCell,
} from "@nextui-org/react";
import { Drawer } from "vaul";
import {
  CompanyStatus,
  OperationMechanicsVersion,
  OrderType,
  ShareLocation,
} from "@server/prisma/prisma.client";
import PlayerAvatar from "../Player/PlayerAvatar";
import { useGame } from "../Game/GameContext";
import ShareOwnershipTable from "./ShareOwnershipTable";
import OrderChipChitWithPlayer from "../Game/OrderChipChitWithPlayer";

const CompanyInfoTable = ({
  company,
  column,
  ordersConcealed,
  ordersRevealed,
  handleDisplayOrderInput,
  handleButtonSelect,
  handleCompanySelect,
  isInteractive,
  isRevealRound,
}: {
  company: CompanyWithRelations;
  column: string;
  ordersConcealed?: PlayerOrderConcealedWithPlayer[] | undefined;
  ordersRevealed?: PlayerOrderWithPlayerRevealed[] | undefined;
  handleDisplayOrderInput: (
    company: CompanyWithSector,
    isIpo?: boolean
  ) => void;
  handleButtonSelect: () => void;
  handleCompanySelect: (company: CompanyWithRelations, isIpo: boolean) => void;
  isInteractive: boolean;
  isRevealRound: boolean;
}) => {
  const { authPlayer, gameState } = useGame();
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  isRevealRound = !gameState?.playerOrdersConcealed || isRevealRound;

  const renderCellContent = ({
    handleShowOrderDetail,
  }: {
    handleShowOrderDetail: () => void;
  }) => {
    switch (column) {
      case "Company Name":
        return <span>{company.name}</span>;
      case "Stock Symbol":
        return <>{company.stockSymbol}</>;
      case "Stock Price":
        return (
          <>
            <RiFundsFill size={20} /> ${company.currentStockPrice}
          </>
        );
      case "Ownership":
        return (
          <>
            <ShareOwnershipTable company={company} />
          </>
        );
      case "Orders":
        return (
          <>
            {isRevealRound
              ? ordersRevealed &&
                ordersRevealed.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {ordersRevealed.map((order, index) => (
                      <OrderChipChitWithPlayer
                        key={index}
                        order={order}
                        showStatus={true}
                      />
                    ))}
                  </div>
                )
              : ordersConcealed &&
                ordersConcealed.length > 0 && (
                  <AvatarGroup>
                    {ordersConcealed.map((order, index) => (
                      <PlayerAvatar key={index} player={order.Player} />
                    ))}
                  </AvatarGroup>
                )}
          </>
        );
      case "OM Shares":
        return (
          <>
            {isInteractive ? (
              <Drawer.Trigger asChild>
                <Button
                  onClick={() => {
                    handleCompanySelect(company, false);
                    handleDisplayOrderInput(company, false);
                  }}
                  className="flex items-center gap-1"
                >
                  <span>Order OM</span>
                  <RiCurrencyFill />
                  <span>
                    {
                      company.Share.filter(
                        (share) => share.location === ShareLocation.OPEN_MARKET
                      ).length
                    }
                  </span>
                </Button>
              </Drawer.Trigger>
            ) : (
              <div className="flex gap-1">
                <RiCurrencyFill />
                <span>
                  {
                    company.Share.filter(
                      (share) => share.location === ShareLocation.OPEN_MARKET
                    ).length
                  }
                </span>
              </div>
            )}
          </>
        );

      case "IPO Price":
        return (
          <>
            <RiFundsBoxFill size={20} /> ${company.ipoAndFloatPrice}
          </>
        );
      case "IPO Shares":
        return (
          <>
            {isInteractive ? (
              <Drawer.Trigger asChild>
                <Button
                  onPress={() => {
                    handleCompanySelect(company, true);
                    handleDisplayOrderInput(company, true);
                  }}
                >
                  <span>Order IPO</span>
                  <RiCurrencyFill />
                  <span>
                    {
                      company.Share.filter(
                        (share) => share.location === ShareLocation.IPO
                      ).length
                    }
                  </span>
                </Button>
              </Drawer.Trigger>
            ) : (
              <div className="flex gap-1">
                <RiCurrencyFill />
                <span>
                  {
                    company.Share.filter(
                      (share) => share.location === ShareLocation.IPO
                    ).length
                  }
                </span>
              </div>
            )}
          </>
        );
      case "Your Shares":
        return authPlayer ? (
          <span>
            {
              company.Share.filter(
                (share) => share.Player?.id === authPlayer.id
              ).length
            }
          </span>
        ) : (
          <span>0</span>
        );
      case "Unit Price":
        return (
          <>
            <RiPriceTag3Fill size={20} /> ${company.unitPrice}
          </>
        );
      case "Cash on Hand":
        return (
          <>
            <RiWallet3Fill size={20} /> ${company.cashOnHand}
          </>
        );
      case "Company Tier":
        return <>{company.companyTier}</>;
      case "Company Status":
        return (
          <span
            className={`${
              company.status === "ACTIVE"
                ? "text-green-500"
                : company.status === "INACTIVE"
                ? "text-yellow-500"
                : "text-red-500"
            }`}
          >
            {company.status}
          </span>
        );
      case "Float %":
        return (
          <span
            className={`flex items-center ${
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
                <RiSailboatFill size={20} />{" "}
                {company.Sector.sharePercentageToFloat}%
              </>
            )}
          </span>
        );
      case "Prestige":
        // Prestige removed - not used in modern game
        return null;
      case "Demand":
        return (
          <>
            <RiHandCoinFill size={20} />{" "}
            {calculateDemand(company.demandScore, company.baseDemand)}
          </>
        );
      case "Has Economies of Scale":
        return <>{company.hasEconomiesOfScale ? "Yes" : "No"}</>;
      case "Loan":
        return company.hasLoan ? (
          <>
            <RiBankCard2Fill size={20} /> $
            {Math.floor(
              (LOAN_AMOUNT + LOAN_AMOUNT * LOAN_INTEREST_RATE) *
                LOAN_INTEREST_RATE
            )}
          </>
        ) : (
          "No Loan"
        );
      case "Sector":
        return (
          <span style={{ color: sectorColors[company.Sector.name] }}>
            {company.Sector.name}
          </span>
        );
      case "Sector Demand":
        return (
          <>
            <RiTeamFill size={20} /> {company.Sector.demand}
          </>
        );
      case "Operational Cost":
        return (
          <>
            <RiExpandUpDownFill size={20} /> $
            {CompanyTierData[company.companyTier].operatingCosts}
          </>
        );
      case "Actions / OR":
        return (
          <>
            <RiGovernmentFill size={20} />{" "}
            {CompanyTierData[company.companyTier].companyActions}
          </>
        );
      case "Brand":
        return (
          <>
            <RiMegaphoneFill size={20} className="text-purple-400" />{" "}
            {company.brandScore ?? 0}
          </>
        );
      case "Research": {
        const researchProgress = company.researchProgress ?? 0;
        return (
          <Popover placement="top" showArrow>
            <PopoverTrigger>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/35 bg-cyan-950/35 px-2 py-1 text-sm text-cyan-50 hover:bg-cyan-900/45 transition-colors"
                aria-label={`Research progress ${researchProgress}, open details`}
              >
                <RiFlaskFill size={20} className="text-cyan-400 shrink-0" />
                <span className="font-medium tabular-nums">{researchProgress}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="max-w-xs">
              <div className="px-1 py-1">
                <div className="text-small font-semibold mb-1 flex items-center gap-2">
                  <RiFlaskFill size={18} className="text-cyan-400 shrink-0" />
                  Research progress
                </div>
                <p className="text-small text-default-500">
                  How many spaces this company has advanced on its research track.
                  Research actions in operations add progress (random 0–2 per investment)
                  and can unlock grants and market favors at higher totals.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        );
      }
      case "Attraction":
        if (gameState?.operationMechanicsVersion === OperationMechanicsVersion.MODERN) {
          return (
            <Popover placement="top" showArrow>
              <PopoverTrigger>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/35 bg-amber-950/35 px-2 py-1 text-sm text-amber-50 hover:bg-amber-900/45 transition-colors"
                  aria-label="Attraction is per factory; open details"
                >
                  <RiPriceTag3Fill size={20} className="text-amber-400 shrink-0" />
                  <span className="font-medium">Per factory</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="max-w-xs">
                <div className="px-1 py-1">
                  <div className="text-small font-semibold mb-1 flex items-center gap-2">
                    <RiPriceTag3Fill size={18} className="text-amber-400 shrink-0" />
                    Attraction
                  </div>
                  <p className="text-small text-default-500">
                    In modern operations, attraction is computed per factory: that factory&apos;s product unit price
                    (sum of its resource prices) minus company brand score. See each factory card on the company
                    tableau for the number; lower is better for winning customers.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          );
        }
        return (
          <>
            <RiPriceTag3Fill size={20} />{" "}
            {company.unitPrice - (company.brandScore ?? 0)}
          </>
        );
      case "Consumers":
        return (
          <>
            <RiTeamFill size={20} /> {company.Sector.consumers}
          </>
        );
      case "Sector Research": {
        const marker = company.Sector.researchMarker;
        return (
          <Popover placement="top" showArrow>
            <PopoverTrigger>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-500/40 bg-slate-900/60 px-2 py-1 text-sm text-slate-100 hover:bg-slate-800/80 transition-colors"
                aria-label={`Sector research track ${marker}, open details`}
              >
                <RiStackFill size={18} className="text-slate-400 shrink-0" />
                <span className="font-medium tabular-nums">{marker}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="max-w-xs">
              <div className="px-1 py-1">
                <div className="text-small font-semibold mb-1 flex items-center gap-2">
                  <RiStackFill size={18} className="text-slate-400 shrink-0" />
                  Sector research track
                </div>
                <p className="text-small text-default-500">
                  Shared progress for all companies in this sector. As the marker rises,
                  the sector unlocks higher research stages, slot bonuses, and demand effects
                  for operating rounds.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        );
      }
      case "Oversold": {
        const n = company.oversoldShares ?? 0;
        if (n <= 0) {
          return <span className="text-slate-500">—</span>;
        }
        return (
          <span className="flex items-center gap-1 text-red-400 font-semibold">
            <RiErrorWarningFill size={18} />
            {n}
          </span>
        );
      }
      default:
        return null;
    }
  };
  const handleShowOrderDetail = () => {
    setShowOrderDetail((prev) => !prev);
  };
  return (
    <div className="flex gap-1">
      {renderCellContent({ handleShowOrderDetail })}
    </div>
  );
};

export default CompanyInfoTable;
