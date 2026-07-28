"use client";

import { useEffect, useRef, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useDisclosure,
} from "@nextui-org/react";
import {
  RiChat3Line,
  RiFileList2Line,
  RiFlashlightFill,
  RiTimeLine,
} from "@remixicon/react";
import { phaseRequiresPlayerInput } from "@server/data/constants";
import { friendlyPhaseName } from "@sectors/app/helpers";
import { cn } from "@/lib/utils";
import { useGame } from "../GameContext";
import PhaseListComponent from "../PhaseListComponent";
import GameLog from "../GameLog";
import GameChat from "../../GameChat/GameChat";
import { BoardPhaseAction } from "./BoardPhaseAction";
import type { BoardFocus } from "./boardFocus";

/**
 * The board's single interaction surface. It names the current phase, says what
 * is expected, and opens the phase's controls in place — auto-opening the first
 * time a phase actually needs the player.
 */
export function BoardActionDock({ focus }: { focus: BoardFocus }) {
  const { gameState, currentPhase } = useGame();
  const phasePanel = useDisclosure();
  const chatPanel = useDisclosure();
  const logPanel = useDisclosure();
  const [dismissedPhaseId, setDismissedPhaseId] = useState<string | null>(null);
  const lastAutoOpenedRef = useRef<string | null>(null);

  const phaseId = currentPhase?.id ?? null;
  const waitsOnPlayers = currentPhase
    ? phaseRequiresPlayerInput(currentPhase.name)
    : false;

  useEffect(() => {
    if (!phaseId || !focus.isActionable || focus.actsOnBoard) return;
    if (lastAutoOpenedRef.current === phaseId) return;
    lastAutoOpenedRef.current = phaseId;
    phasePanel.onOpen();
  }, [phaseId, focus.isActionable, focus.actsOnBoard, phasePanel]);

  const isDismissed = dismissedPhaseId === phaseId;

  return (
    <>
      <div
        className={cn(
          "flex shrink-0 items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors",
          focus.isActionable && !isDismissed
            ? "border-amber-500/70 bg-amber-950/25"
            : "border-zinc-800 bg-zinc-950/70"
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wider",
            focus.isActionable
              ? "bg-amber-500 text-amber-950"
              : "bg-zinc-800 text-zinc-300"
          )}
        >
          {focus.isActionable && <RiFlashlightFill size={13} />}
          {friendlyPhaseName(currentPhase?.name)}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs text-zinc-400">
          {focus.prompt}
          {!waitsOnPlayers && (
            <span className="ml-1.5 text-zinc-600">· advances on its own</span>
          )}
        </span>

        <button
          type="button"
          onClick={phasePanel.onOpen}
          className={cn(
            "shrink-0 rounded-md px-3 py-1 text-[11px] font-semibold transition-colors",
            focus.isActionable
              ? "bg-amber-500 text-amber-950 hover:bg-amber-400"
              : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
          )}
        >
          {focus.isActionable
            ? focus.actsOnBoard
              ? "Phase details"
              : "Take action"
            : "Open phase"}
        </button>

        <Popover placement="top-end">
          <PopoverTrigger>
            <button
              type="button"
              className="shrink-0 rounded-md border border-zinc-800 p-1.5 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
              aria-label="Phase timeline"
            >
              <RiTimeLine size={15} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="max-h-[70vh] w-80 overflow-y-auto border border-zinc-700 bg-zinc-950 p-0 scrollbar">
            <PhaseListComponent />
          </PopoverContent>
        </Popover>

        <button
          type="button"
          onClick={chatPanel.onOpen}
          className="shrink-0 rounded-md border border-zinc-800 p-1.5 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
          aria-label="Table chat"
        >
          <RiChat3Line size={15} />
        </button>
        <button
          type="button"
          onClick={logPanel.onOpen}
          className="shrink-0 rounded-md border border-zinc-800 p-1.5 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
          aria-label="Game log"
        >
          <RiFileList2Line size={15} />
        </button>
      </div>

      <Modal
        isOpen={phasePanel.isOpen}
        onOpenChange={(open) => {
          if (!open) setDismissedPhaseId(phaseId);
          phasePanel.onOpenChange();
        }}
        size="5xl"
        scrollBehavior="inside"
        className="dark bg-zinc-950 text-foreground"
        classNames={{ base: "max-h-[90dvh]" }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-0.5 border-b border-zinc-800">
            <span>{friendlyPhaseName(currentPhase?.name)}</span>
            <span className="text-xs font-normal text-zinc-400">
              {focus.prompt}
            </span>
          </ModalHeader>
          <ModalBody className="pb-6">
            <BoardPhaseAction />
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={chatPanel.isOpen}
        onOpenChange={chatPanel.onOpenChange}
        size="2xl"
        scrollBehavior="inside"
        className="dark bg-zinc-950 text-foreground"
        classNames={{ base: "max-h-[85dvh] h-[85dvh]" }}
      >
        <ModalContent>
          <ModalHeader>Table chat</ModalHeader>
          <ModalBody className="pb-4">
            {gameState.roomId && gameState.name && (
              <GameChat roomId={gameState.roomId} gameName={gameState.name} />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={logPanel.isOpen}
        onOpenChange={logPanel.onOpenChange}
        size="3xl"
        scrollBehavior="inside"
        className="dark bg-zinc-950 text-foreground"
        classNames={{ base: "max-h-[85dvh]" }}
      >
        <ModalContent>
          <ModalHeader>Game log</ModalHeader>
          <ModalBody className="pb-4">
            <GameLog />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
