"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@nextui-org/react";
import {
  PLOT_FEE_FRESH,
  calculateFactoryConstructionCost,
  describeCompanyTrait,
} from "@server/data/company-traits";
import {
  getMaterialLimitForFactorySize,
  getNumberForFactorySize,
  resolveFactoryBlueprint,
} from "@server/data/helpers";
import { getSectorResourceForSectorName } from "@server/data/constants";
import {
  FactorySize,
  ResourceTrackType,
  ResourceType,
  SectorName,
} from "@server/prisma/prisma.client";
import { trpc } from "@sectors/app/trpc";
import { formatEnumLabel } from "@sectors/app/helpers/labels";
import { factorySizesForSlot, type FactorySlotPhase } from "@sectors/app/helpers/tableauSlots";
import { RiCloseLine } from "@remixicon/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useGame } from "../GameContext";
import DebounceButton from "../../General/DebounceButton";
import { ResourceGlyph } from "./ResourceGlyph";

export interface BuildTarget {
  companyId: string;
  companyName: string;
  symbol: string;
  sectorName: string;
  sectorEnum: string;
  color: string;
  slotNumber: number;
  phase: FactorySlotPhase;
  cashOnHand: number;
}

/**
 * Blueprint picker for one factory slot. The sector's own material is fixed at
 * the head of the blueprint, exactly as the server resolves it, so the quoted
 * cost matches what gets charged.
 */
export function BoardBuildModal({
  target,
  onClose,
}: {
  target: BuildTarget | null;
  onClose: () => void;
}) {
  const { gameId, authPlayer } = useGame();
  const sizes = target ? factorySizesForSlot(target.phase) : [];
  const [size, setSize] = useState<FactorySize>(
    target?.phase.min ?? FactorySize.FACTORY_I
  );
  const [extras, setExtras] = useState<ResourceType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: resources } = trpc.resource.getGameResources.useQuery(
    { gameId },
    { enabled: !!gameId && !!target }
  );
  const { data: company } = trpc.company.getCompanyWithSector.useQuery(
    { id: target?.companyId ?? "" },
    { enabled: !!target?.companyId }
  );
  const utils = trpc.useUtils();

  // Reopening on a different slot must not inherit the previous slot's choices.
  useEffect(() => {
    setSize(target?.phase.min ?? FactorySize.FACTORY_I);
    setExtras([]);
  }, [target?.companyId, target?.slotNumber, target?.phase.min]);

  const priceByType = useMemo(() => {
    const map = new Map<ResourceType, number>();
    for (const resource of resources ?? []) {
      map.set(resource.type, resource.price);
    }
    return map;
  }, [resources]);

  const globalTypes = useMemo(
    () =>
      (resources ?? [])
        .filter((resource) => resource.trackType === ResourceTrackType.GLOBAL)
        .map((resource) => resource.type),
    [resources]
  );

  const sectorType = target
    ? getSectorResourceForSectorName(target.sectorEnum as SectorName)
    : undefined;

  const materialLimit = getMaterialLimitForFactorySize(size);
  const blueprint = useMemo(() => {
    const chosen = sectorType
      ? [sectorType as ResourceType, ...extras]
      : [...extras];
    return chosen.slice(0, materialLimit);
  }, [sectorType, extras, materialLimit]);

  const isComplete = blueprint.length === materialLimit;

  const cost = useMemo(() => {
    if (!company) return 0;
    return calculateFactoryConstructionCost(
      size,
      resolveFactoryBlueprint(blueprint, company.Sector?.sectorName),
      priceByType,
      company
    );
  }, [company, size, blueprint, priceByType]);

  const affordable = !target || cost <= target.cashOnHand;

  const createOrder = trpc.factoryConstruction.createOrder.useMutation({
    onSuccess: () => {
      toast.success(
        `Factory ${size.replace("FACTORY_", "")} commissioned for ${
          target?.symbol
        }`,
        { duration: 3000 }
      );
      utils.factory.getGameFactories.invalidate();
      utils.factoryConstruction.getOutstandingOrders.invalidate();
      onClose();
    },
    onError: (error) => toast.error(error.message, { duration: 6000 }),
    onSettled: () => setIsSubmitting(false),
  });

  const toggleExtra = (type: ResourceType) => {
    setExtras((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : current.length + (sectorType ? 1 : 0) >= materialLimit
          ? current
          : [...current, type]
    );
  };

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
                  build in slot {target.slotNumber}
                </span>
              </div>
              <span className="text-xs font-normal text-zinc-500">
                {target.sectorName} · company cash ${target.cashOnHand}
              </span>
            </ModalHeader>
            <ModalBody className="flex flex-col gap-3 pb-5">
              {sizes.length > 1 && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Factory size
                  </span>
                  <div className="flex gap-1 rounded-md bg-zinc-900 p-0.5">
                    {sizes.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSize(option)}
                        className={cn(
                          "flex-1 rounded px-2 py-1 text-xs font-semibold transition-colors",
                          option === size
                            ? "bg-orange-600 text-white"
                            : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                        )}
                      >
                        Factory {option.replace("FACTORY_", "")}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <span className="flex items-baseline justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Blueprint
                  <span className="tabular-nums text-zinc-400">
                    {blueprint.length}/{materialLimit} materials
                  </span>
                </span>
                <div className="flex flex-wrap gap-1">
                  {sectorType && (
                    <span
                      className="flex items-center gap-1.5 rounded border border-sky-700/60 bg-sky-950/40 px-2 py-1.5 text-xs"
                      title="The sector's own material is always required"
                    >
                      <ResourceGlyph type={sectorType} size={10} />
                      {formatEnumLabel(sectorType)}
                      <span className="tabular-nums text-zinc-400">
                        ${priceByType.get(sectorType as ResourceType) ?? 0}
                      </span>
                    </span>
                  )}
                  {globalTypes.map((type) => {
                    const chosen = extras.includes(type);
                    const full =
                      blueprint.length >= materialLimit && !chosen;
                    return (
                      <button
                        key={type}
                        type="button"
                        disabled={full}
                        onClick={() => toggleExtra(type)}
                        className={cn(
                          "flex items-center gap-1.5 rounded border px-2 py-1.5 text-xs transition-colors",
                          chosen
                            ? "border-emerald-600/70 bg-emerald-950/40 text-zinc-100"
                            : "border-zinc-800 bg-zinc-900/70 text-zinc-300 hover:border-zinc-600",
                          full && "cursor-not-allowed opacity-40"
                        )}
                      >
                        <ResourceGlyph type={type} size={10} />
                        {formatEnumLabel(type)}
                        <span className="tabular-nums text-zinc-500">
                          ${priceByType.get(type) ?? 0}
                        </span>
                        {chosen && <RiCloseLine size={12} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <dl className="flex flex-col gap-1 rounded-md border border-zinc-800 bg-zinc-900/60 p-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-zinc-500">
                    Materials × size (×{getNumberForFactorySize(size)})
                  </dt>
                  <dd className="tabular-nums text-zinc-300">
                    ${Math.max(0, cost - PLOT_FEE_FRESH)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Plot fee</dt>
                  <dd className="tabular-nums text-zinc-300">
                    ${PLOT_FEE_FRESH}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-zinc-800 pt-1">
                  <dt className="font-semibold text-zinc-300">Total</dt>
                  <dd
                    className={cn(
                      "font-bold tabular-nums",
                      affordable ? "text-orange-400" : "text-rose-400"
                    )}
                  >
                    ${cost}
                  </dd>
                </div>
                {describeCompanyTrait(company) && (
                  <p className="text-[11px] text-emerald-400">
                    {describeCompanyTrait(company)}
                  </p>
                )}
              </dl>

              <p className="text-[11px] leading-relaxed text-zinc-500">
                The order is charged when operations resolve, and the factory
                starts producing the turn after that. Cheaper materials mean a
                lower unit price, which is what pulls customers in.
              </p>

              {!affordable && (
                <p className="rounded-md border border-amber-700/50 bg-amber-950/40 px-2 py-1.5 text-center text-[11px] text-amber-300">
                  {target.symbol} is ${cost - target.cashOnHand} short of this
                  build.
                </p>
              )}

              <div className="flex gap-2">
                <DebounceButton
                  className="flex-1 bg-orange-600 font-semibold text-white"
                  isDisabled={!isComplete || !affordable || !authPlayer}
                  isLoading={isSubmitting}
                  onClick={() => {
                    if (!authPlayer) return;
                    setIsSubmitting(true);
                    createOrder.mutate({
                      companyId: target.companyId,
                      gameId,
                      playerId: authPlayer.id,
                      size,
                      resourceTypes: blueprint,
                    });
                  }}
                >
                  {isComplete
                    ? `Commission for $${cost}`
                    : `Pick ${materialLimit - blueprint.length} more`}
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

export default BoardBuildModal;
