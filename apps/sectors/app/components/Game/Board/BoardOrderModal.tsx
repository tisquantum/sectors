"use client";

import {
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@nextui-org/react";
import { ShareLocation } from "@server/prisma/prisma.client";
import type { CompanyWithRelations } from "@server/prisma/prisma.types";
import { RiErrorWarningFill } from "@remixicon/react";
import PlayerOrderInput from "../../Player/PlayerOrderInput";

export interface OrderTarget {
  company: CompanyWithRelations;
  isIpo: boolean;
}

/**
 * Order entry, opened from the company tile it belongs to. The modal stays open
 * after a confirm so several orders can be placed in one sitting.
 */
export function BoardOrderModal({
  target,
  onClose,
}: {
  target: OrderTarget | null;
  onClose: () => void;
}) {
  const shareCount = target
    ? target.company.Share.filter(
        (share) =>
          share.location ===
          (target.isIpo ? ShareLocation.IPO : ShareLocation.OPEN_MARKET)
      ).length
    : 0;
  const oversold = target?.company.oversoldShares ?? 0;

  return (
    <Modal
      isOpen={!!target}
      onOpenChange={(open) => !open && onClose()}
      size="lg"
      scrollBehavior="inside"
      className="dark bg-zinc-950 text-foreground"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span>
              {target?.isIpo ? "IPO order" : "Open market order"} ·{" "}
              {target?.company.name}
            </span>
            {oversold > 0 && (
              <Chip
                color="danger"
                variant="flat"
                size="sm"
                startContent={<RiErrorWarningFill className="h-3.5 w-3.5" />}
              >
                {oversold} oversold
              </Chip>
            )}
          </div>
          <span className="text-xs font-normal text-zinc-400">
            {shareCount} share{shareCount === 1 ? "" : "s"} available at $
            {target?.isIpo
              ? target?.company.ipoAndFloatPrice
              : target?.company.currentStockPrice}
          </span>
        </ModalHeader>
        <ModalBody className="items-center pb-6">
          {target && (
            <PlayerOrderInput
              currentOrder={target.company}
              isIpo={target.isIpo}
              handleCancel={onClose}
              handlePlayerInputConfirmed={() => {}}
            />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
