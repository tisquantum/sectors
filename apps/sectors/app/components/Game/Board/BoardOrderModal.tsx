"use client";

import {
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@nextui-org/react";
import { sectorColors } from "@server/data/gameData";
import type { CompanyWithRelations } from "@server/prisma/prisma.types";
import { RiErrorWarningFill } from "@remixicon/react";
import { BoardOrderForm } from "./BoardOrderForm";

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
  const oversold = target?.company.oversoldShares ?? 0;
  const sectorName = target?.company.Sector?.name;
  const accent = (sectorName && sectorColors[sectorName]) || "#52525b";

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
                  style={{ backgroundColor: accent }}
                />
                <span className="text-base font-bold">
                  {target.company.stockSymbol}
                </span>
                <span className="min-w-0 truncate text-sm font-normal text-zinc-400">
                  {target.company.name}
                </span>
                <Chip
                  size="sm"
                  variant="flat"
                  className="ml-auto shrink-0"
                  classNames={{ content: "text-[10px] font-semibold uppercase" }}
                >
                  {target.isIpo ? "IPO" : "Open market"}
                </Chip>
              </div>
              {oversold > 0 && (
                <Chip
                  color="danger"
                  variant="flat"
                  size="sm"
                  startContent={<RiErrorWarningFill className="h-3.5 w-3.5" />}
                >
                  {oversold} oversold — the price will fall
                </Chip>
              )}
            </ModalHeader>
            <ModalBody className="pb-5">
              <BoardOrderForm
                company={target.company}
                isIpo={target.isIpo}
                onClose={onClose}
              />
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export default BoardOrderModal;
