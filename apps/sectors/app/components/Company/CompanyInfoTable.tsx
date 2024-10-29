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
  RiSparkling2Fill,
  RiHandCoinFill,
  RiBox2Fill,
  RiIncreaseDecreaseFill,
  RiExpandUpDownFill,
  RiGovernmentFill,
  RiBankCard2Fill,
  RiSailboatFill,
  RiTeamFill,
  RiFundsBoxFill,
  RiCurrencyFill,
} from "@remixicon/react";
import {
  CompanyTierData,
  LOAN_AMOUNT,
  LOAN_INTEREST_RATE,
} from "@server/data/constants";
import { calculateCompanySupply, calculateDemand } from "@server/data/helpers";
import { sectorColors } from "@server/data/gameData";
import DebounceButton from "../General/DebounceButton";
import { AvatarGroup, Button, TableCell } from "@nextui-org/react";
import { Drawer } from "vaul";
import {
  CompanyStatus,
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
        return (
          <>
            <RiSparkling2Fill size={20} className="text-yellow-500" />{" "}
            {company.prestigeTokens}
          </>
        );
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
