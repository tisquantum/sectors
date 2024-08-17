import React, { useState } from "react";
import {
  CompanyWithRelations,
  CompanyWithSector,
  PlayerOrderConcealedWithPlayer,
  PlayerOrderWithPlayerCompany,
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
import { CompanyStatus } from "@server/prisma/prisma.client";
import PlayerAvatar from "../Player/PlayerAvatar";
import { useGame } from "../Game/GameContext";
import ShareOwnershipTable from "./ShareOwnershipTable";

const CompanyInfoTable = ({
  company,
  column,
  orders,
  handleDisplayOrderInput,
  handleButtonSelect,
  handleCompanySelect,
  isInteractive,
}: {
  company: CompanyWithRelations;
  column: string;
  orders: PlayerOrderConcealedWithPlayer[] | undefined;
  handleDisplayOrderInput: (
    company: CompanyWithSector,
    isIpo?: boolean
  ) => void;
  handleButtonSelect: () => void;
  handleCompanySelect: (company: CompanyWithRelations, isIpo: boolean) => void;
  isInteractive: boolean;
}) => {
  const { authPlayer } = useGame();
  const [showOrderDetail, setShowOrderDetail] = useState(false);
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
            {orders && orders.length > 0 && (
              <AvatarGroup>
                {orders.map((order, index) => (
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
                >
                  Place Order (
                  {
                    company.Share.filter(
                      (share) => share.location === "OPEN_MARKET"
                    ).length
                  }
                  )
                </Button>
              </Drawer.Trigger>
            ) : (
              <div>
                {
                  company.Share.filter(
                    (share) => share.location === "OPEN_MARKET"
                  ).length
                }
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
                  Place Order (
                  {
                    company.Share.filter((share) => share.location === "IPO")
                      .length
                  }
                  )
                </Button>
              </Drawer.Trigger>
            ) : (
              <div>
                {
                  company.Share.filter((share) => share.location === "IPO")
                    .length
                }
              </div>
            )}
          </>
        );
      case "Your Shares":
        return (
          <span>
            {
              company.Share.filter(
                (share) => share.Player?.id === authPlayer.id
              ).length
            }
          </span>
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
            <RiBankCard2Fill size={20} /> ${LOAN_AMOUNT * LOAN_INTEREST_RATE}
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
