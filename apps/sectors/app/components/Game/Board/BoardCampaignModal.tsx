"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@nextui-org/react";
import { getSectorResourceForSectorName } from "@server/data/constants";
import { isMarketingTierUnlockedForSector } from "@server/data/marketing-unlock";
import {
  MarketingCampaignTier,
  ResourceType,
  SectorName,
} from "@server/prisma/prisma.client";
import { trpc } from "@sectors/app/trpc";
import { formatEnumLabel } from "@sectors/app/helpers/labels";
import {
  MARKETING_TIERS,
  MARKETING_TIER_CONFIG,
} from "@sectors/app/helpers/tableauSlots";
import { RiCloseLine, RiLockLine } from "@remixicon/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useGame } from "../GameContext";
import DebounceButton from "../../General/DebounceButton";
import { ResourceGlyph } from "./ResourceGlyph";

export interface CampaignTarget {
  companyId: string;
  symbol: string;
  sectorName: string;
  sectorEnum: string;
  color: string;
  slotNumber: number;
  researchMarker: number;
  cashOnHand: number;
}

const BASE_MATERIALS: ResourceType[] = [
  ResourceType.CIRCLE,
  ResourceType.SQUARE,
  ResourceType.TRIANGLE,
];

/**
 * Campaign setup for one marketing slot. The materials chosen here go into the
 * sector's consumption bag, so they decide which customers the campaign pulls.
 */
export function BoardCampaignModal({
  target,
  onClose,
}: {
  target: CampaignTarget | null;
  onClose: () => void;
}) {
  const { gameId, authPlayer } = useGame();
  const [tier, setTier] = useState<MarketingCampaignTier>(
    MarketingCampaignTier.TIER_1
  );
  const [picks, setPicks] = useState<ResourceType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: resources } = trpc.resource.getGameResources.useQuery(
    { gameId },
    { enabled: !!gameId && !!target }
  );
  const utils = trpc.useUtils();

  const unlockedTiers = useMemo(
    () =>
      MARKETING_TIERS.filter((option) =>
        isMarketingTierUnlockedForSector(target?.researchMarker ?? 0, option)
      ),
    [target?.researchMarker]
  );

  useEffect(() => {
    setTier(
      unlockedTiers[unlockedTiers.length - 1] ?? MarketingCampaignTier.TIER_1
    );
    setPicks([]);
  }, [target?.companyId, target?.slotNumber, unlockedTiers]);

  const config = MARKETING_TIER_CONFIG[tier];
  const sectorMaterial = target
    ? (getSectorResourceForSectorName(target.sectorEnum as SectorName) as
        | ResourceType
        | undefined)
    : undefined;
  const options = sectorMaterial
    ? [...BASE_MATERIALS, sectorMaterial]
    : BASE_MATERIALS;

  const priceByType = useMemo(() => {
    const map = new Map<string, number>();
    for (const resource of resources ?? []) {
      map.set(resource.type, resource.price);
    }
    return map;
  }, [resources]);

  const isComplete = picks.length === config.resources;
  const affordable = !target || config.cost <= target.cashOnHand;

  const submit = trpc.modernOperations.submitMarketingCampaign.useMutation({
    onSuccess: () => {
      toast.success(`Campaign ${config.label} launched for ${target?.symbol}`, {
        duration: 3000,
      });
      utils.marketing.getGameCampaigns.invalidate();
      utils.marketing.getCompanyCampaigns.invalidate();
      onClose();
    },
    onError: (error) => toast.error(error.message, { duration: 6000 }),
    onSettled: () => setIsSubmitting(false),
  });

  return (
    <Modal
      isOpen={!!target}
      onOpenChange={(open) => !open && onClose()}
      size="md"
      scrollBehavior="inside"
      className="dark bg-zinc-950 text-foreground"
    >
      <ModalContent>
        {target && (
          <>
            <ModalHeader className="flex flex-col gap-1 pb-2">
              <div className="flex items-center gap-2">
                <span
                  className="h-6 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: target.color }}
                />
                <span className="text-base font-bold">{target.symbol}</span>
                <span className="min-w-0 truncate text-sm font-normal text-zinc-400">
                  campaign in slot {target.slotNumber}
                </span>
              </div>
              <span className="text-xs font-normal text-zinc-500">
                {target.sectorName} · company cash ${target.cashOnHand}
              </span>
            </ModalHeader>
            <ModalBody className="flex flex-col gap-3 pb-5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Campaign tier
                </span>
                <div className="flex gap-1 rounded-md bg-zinc-900 p-0.5">
                  {MARKETING_TIERS.map((option) => {
                    const unlocked = unlockedTiers.includes(option);
                    const optionConfig = MARKETING_TIER_CONFIG[option];
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={!unlocked}
                        title={
                          unlocked
                            ? undefined
                            : "Advance the sector research track to unlock this tier"
                        }
                        onClick={() => {
                          setTier(option);
                          setPicks([]);
                        }}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-colors",
                          option === tier
                            ? "bg-fuchsia-700 text-white"
                            : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                          !unlocked && "cursor-not-allowed opacity-40"
                        )}
                      >
                        {!unlocked && <RiLockLine size={10} />}
                        {optionConfig.label}
                        <span className="tabular-nums opacity-70">
                          ${optionConfig.cost}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <dl className="grid grid-cols-4 gap-1 text-center">
                {[
                  { label: "Cost", value: `$${config.cost}`, tone: "text-zinc-200" },
                  { label: "Brand", value: `+${config.brandBonus}`, tone: "text-emerald-400" },
                  { label: "Demand", value: `+${config.demandBonus}`, tone: "text-cyan-400" },
                  { label: "Workers", value: config.workers, tone: "text-zinc-200" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded border border-zinc-800 bg-zinc-900/60 px-1 py-1 leading-tight"
                  >
                    <dt className="text-[9px] uppercase tracking-wider text-zinc-500">
                      {stat.label}
                    </dt>
                    <dd className={cn("text-sm font-bold tabular-nums", stat.tone)}>
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="flex flex-col gap-1">
                <span className="flex items-baseline justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Consumption bag materials
                  <span className="tabular-nums text-zinc-400">
                    {picks.length}/{config.resources}
                  </span>
                </span>
                <div className="flex flex-wrap gap-1">
                  {options.map((type) => {
                    const count = picks.filter((pick) => pick === type).length;
                    const full = picks.length >= config.resources;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setPicks((current) =>
                            current.length >= config.resources
                              ? current
                              : [...current, type]
                          )
                        }
                        disabled={full}
                        className={cn(
                          "flex items-center gap-1.5 rounded border px-2 py-1.5 text-xs transition-colors",
                          count > 0
                            ? "border-fuchsia-600/70 bg-fuchsia-950/40 text-zinc-100"
                            : "border-zinc-800 bg-zinc-900/70 text-zinc-300 hover:border-zinc-600",
                          full && count === 0 && "cursor-not-allowed opacity-40"
                        )}
                      >
                        <ResourceGlyph type={type} size={10} />
                        {formatEnumLabel(type)}
                        {count > 0 && (
                          <span className="tabular-nums text-fuchsia-300">
                            ×{count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {picks.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    {picks.map((type, index) => (
                      <button
                        key={`${type}-${index}`}
                        type="button"
                        onClick={() =>
                          setPicks((current) =>
                            current.filter((_, i) => i !== index)
                          )
                        }
                        title="Remove"
                        className="flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[11px] text-zinc-300 hover:bg-zinc-700"
                      >
                        <ResourceGlyph type={type} size={8} />
                        {formatEnumLabel(type)}
                        <RiCloseLine size={11} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-[11px] leading-relaxed text-zinc-500">
                Cash is charged now. Brand score and the sector demand bonus
                apply when operations resolve and last two turns before the
                campaign decays. Materials you add pull the customers who want
                them into your sector.
              </p>

              {!affordable && (
                <p className="rounded-md border border-amber-700/50 bg-amber-950/40 px-2 py-1.5 text-center text-[11px] text-amber-300">
                  {target.symbol} is ${config.cost - target.cashOnHand} short of
                  this campaign.
                </p>
              )}

              <div className="flex gap-2">
                <DebounceButton
                  className="flex-1 bg-fuchsia-700 font-semibold text-white"
                  isDisabled={!isComplete || !affordable || !authPlayer}
                  isLoading={isSubmitting}
                  onClick={() => {
                    if (!authPlayer) return;
                    setIsSubmitting(true);
                    submit.mutate({
                      companyId: target.companyId,
                      gameId,
                      playerId: authPlayer.id,
                      tier,
                      slot: target.slotNumber,
                      resourceTypes: picks,
                    });
                  }}
                >
                  {isComplete
                    ? `Launch for $${config.cost}`
                    : `Pick ${config.resources - picks.length} more`}
                </DebounceButton>
                <DebounceButton
                  className="bg-zinc-800 text-zinc-300"
                  onClick={onClose}
                >
                  Cancel
                </DebounceButton>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export default BoardCampaignModal;
