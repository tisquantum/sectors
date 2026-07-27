import {
  Accordion,
  AccordionItem,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useDisclosure,
} from "@nextui-org/react";
import {
  RiBuilding3Fill,
  RiFundsFill,
  RiHandCoinFill,
  RiMegaphoneFill,
  RiFlaskFill,
  RiSailboatFill,
  RiShapesFill,
  RiSparkling2Fill,
  RiTeamFill,
  RiWallet3Fill,
  RiVipCrown2Fill,
  RiHashtag,
} from "@remixicon/react";
import { sectorColors } from "@server/data/gameData";
import { CompanyStatus, Player } from "@server/prisma/prisma.client";
import { CompanyWithSector } from "@server/prisma/prisma.types";
import { trpc } from "@sectors/app/trpc";
import { MoneyTransactionHistoryByCompany } from "../../Game/MoneyTransactionHistory";
import { useGame } from "../../Game/GameContext";
import { useEffect } from "react";
import PlayerAvatar from "../../Player/PlayerAvatar";
import { CompanyLineChart } from "../CompanyLineChart";
import { ModernCompany } from "./ModernCompany";
import ShareHolders from "../ShareHolders";
import {
  COMPANY_TRAIT_DEFINITIONS,
  describeCompanyTrait,
} from "@server/data/company-traits";
import { StatChip, StatChipRow, StatTone } from "@/components/ui/StatChip";
import { formatEnumLabel } from "@sectors/app/helpers/labels";

const ICON = 16;

function statusTone(status: CompanyStatus): StatTone {
  if (status === CompanyStatus.ACTIVE) return "positive";
  if (status === CompanyStatus.INACTIVE) return "caution";
  return "danger";
}

/**
 * The company's trait and the material it applies to. Modern games only; legacy
 * companies have no trait and render nothing.
 */
const CompanyTraitChip = ({ company }: { company: CompanyWithSector }) => {
  const description = describeCompanyTrait(company);
  if (!company.traitType || !company.traitResource || !description) {
    return null;
  }
  const { label } = COMPANY_TRAIT_DEFINITIONS[company.traitType];
  return (
    <StatChip
      label={label}
      value={formatEnumLabel(company.traitResource)}
      icon={<RiSparkling2Fill size={ICON} className="text-emerald-400 shrink-0" />}
      tone="trait"
      help={description}
    />
  );
};

/**
 * Every headline statistic for a company, as one consistent run of chips.
 *
 * Each chip carries its own explanation, opened by pressing the chip. Both the compact
 * and full presentations render the same set, so a company reads identically wherever it
 * appears.
 */
const CompanyStats = ({
  company,
  ceoPlayer,
  companyPriority,
  onOpenTransactions,
}: {
  company: CompanyWithSector;
  ceoPlayer?: Player | null;
  companyPriority?: { global?: number | null; sector?: number | null } | null;
  onOpenTransactions: () => void;
}) => {
  const isAtIpoPrice =
    company.ipoAndFloatPrice != null &&
    company.currentStockPrice === company.ipoAndFloatPrice;

  return (
    <StatChipRow>
      <StatChip
        label="Stock Price"
        value={`$${company.currentStockPrice}`}
        icon={<RiFundsFill size={ICON} className="shrink-0" />}
        size="lg"
        help={
          isAtIpoPrice
            ? "Stock price matches IPO and float price."
            : "The company's current share price."
        }
        helpExtra={<CompanyLineChart companyId={company.id} />}
      />

      {company.ipoAndFloatPrice != null && (
        <StatChip
          label="IPO Price"
          value={`$${company.ipoAndFloatPrice}`}
          showLabel
          help="The initial public offering price."
        />
      )}

      {companyPriority?.global != null && (
        <StatChip
          label="Global Priority"
          value={companyPriority.global}
          icon={<RiHashtag size={ICON} className="shrink-0" />}
          help="Global company priority based on stock price (highest to lowest), then stacking order across all sectors."
        />
      )}

      {companyPriority?.sector != null && (
        <StatChip
          label="Sector Priority"
          value={companyPriority.sector}
          icon={<RiHashtag size={ICON} className="shrink-0" />}
          style={{
            backgroundColor: `${sectorColors[company.Sector.name]}80`,
            borderColor: sectorColors[company.Sector.name],
          }}
          help="Sector company priority based on stock price (highest to lowest), then stacking order within this sector."
        />
      )}

      <StatChip
        label="Company Status"
        value={formatEnumLabel(company.status)}
        tone={statusTone(company.status)}
        help="The company status. Inactive companies have not yet floated."
      />

      {(company.status === CompanyStatus.INACTIVE ||
        company.status === CompanyStatus.ACTIVE) && (
        <StatChip
          label="Float Percentage"
          value={`${company.Sector.sharePercentageToFloat}%`}
          icon={<RiSailboatFill size={ICON} className="shrink-0" />}
          tone={statusTone(company.status)}
          help="Share percentage required to float companies in this sector."
        />
      )}

      <StatChip
        label="Cash on Hand"
        value={`$${company.cashOnHand}`}
        icon={<RiWallet3Fill size={ICON} className="shrink-0" />}
        help="Corporate treasury or cash on hand."
        helpExtra={
          <Button size="sm" variant="flat" onPress={onOpenTransactions}>
            View transaction history
          </Button>
        }
      />

      {ceoPlayer && (
        <StatChip
          label="CEO"
          value={<PlayerAvatar player={ceoPlayer} size="sm" showNameLabel />}
          icon={
            <RiVipCrown2Fill size={ICON} className="shrink-0 text-amber-400/90" />
          }
          help="The CEO (Chief Executive Officer) of this company."
        />
      )}

      <StatChip
        label="Sector research track"
        value={`${company.Sector.researchMarker}/12`}
        icon={<RiFlaskFill size={ICON} className="text-cyan-400 shrink-0" />}
        tone="research"
        help="One 12-space track per sector, shared by all companies there. This number is the sector position (not per company). Higher markers unlock stages, factory and marketing slots, and sector demand bonuses in modern operations."
      />

      <StatChip
        label="Brand Score"
        value={company.brandScore ?? 0}
        icon={<RiMegaphoneFill size={ICON} className="text-purple-400 shrink-0" />}
        tone="brand"
        help="Increased by marketing campaigns. Higher brand improves attraction (lowers effective price). Per factory: product unit price (sum of resource prices) − brand score; shown on each factory card."
      />

      <CompanyTraitChip company={company} />
    </StatChipRow>
  );
};

/** Sector-level context: which sector, its demand, and consumers waiting in it. */
const CompanySectorContext = ({ company }: { company: CompanyWithSector }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    <StatChip
      label="Sector"
      value={formatEnumLabel(company.Sector.name)}
      icon={<RiShapesFill size={ICON} className="shrink-0" />}
      style={{
        backgroundColor: `${sectorColors[company.Sector.name]}80`,
        borderColor: sectorColors[company.Sector.name],
      }}
    />
    <StatChip
      label="Sector Demand"
      value={company.Sector.demand + (company.Sector.demandBonus || 0)}
      icon={<RiHandCoinFill size={ICON} className="shrink-0" />}
      help="Sector demand is research slot bonuses plus demand bonuses from active marketing campaigns (tier I +1, tier II +1, tier III +2 each while active). Brand score does not affect sector demand. Consumer distribution and worker salaries follow sector demand rankings (1st: 50% economy score, 2nd: 30%, 3rd: 20%)."
    />
    <StatChip
      label="Consumers"
      value={company.Sector.consumers}
      icon={<RiTeamFill size={ICON} className="shrink-0" />}
      help="The amount of consumers currently looking to buy in this sector."
    />
    <ShareHolders companyId={company.id} isMinimal />
  </div>
);

const CompanyInfoV2 = ({
  companyId,
  showingProductionResults,
  isMinimal,
}: {
  companyId: string;
  showingProductionResults?: boolean;
  /** Identity and stats only: omits sector context and the operations panel. */
  isMinimal?: boolean;
}) => {
  const { currentPhase, authPlayer } = useGame();
  const {
    data: company,
    isLoading: isLoadingCompany,
    refetch: refetchCompany,
  } = trpc.company.getCompanyWithSector.useQuery({ id: companyId });
  const { data: companyActions, isLoading: isLoadingCompanyActions } =
    trpc.companyAction.listCompanyActions.useQuery({ where: { companyId } });
  const { data: ceoPlayer } = trpc.player.getPlayer.useQuery(
    { where: { id: company?.ceoId || "" } },
    { enabled: !!company?.ceoId }
  );
  const { data: companyPriority } = trpc.company.getCompanyPriority.useQuery(
    { companyId, gameId: company?.gameId || "" },
    { enabled: !!company?.gameId && !!companyId }
  );
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  useEffect(() => {
    refetchCompany();
  }, [currentPhase?.id, refetchCompany]);

  if (isLoadingCompany || isLoadingCompanyActions) {
    return <div className="text-sm text-gray-400">Loading...</div>;
  }
  if (!company) {
    return <div className="text-sm text-gray-400">No company found</div>;
  }

  return (
    <>
      <div className="flex flex-col gap-2 w-full">
        {/* Identity is the one thing that should dominate the card. */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <RiBuilding3Fill size={18} className="shrink-0 self-center" />
          <span className="text-lg font-bold leading-tight">{company.name}</span>
          <span className="text-sm font-medium text-gray-400 tracking-wide">
            {company.stockSymbol}
          </span>
        </div>

        <CompanyStats
          company={company}
          ceoPlayer={ceoPlayer as Player | null | undefined}
          companyPriority={companyPriority}
          onOpenTransactions={onOpen}
        />

        {!isMinimal && (
          <>
            <CompanySectorContext company={company} />

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
          </>
        )}
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
