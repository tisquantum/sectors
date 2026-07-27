"use client";

import { useEffect, useRef } from "react";
import { Drawer } from "vaul";
import { toast } from "sonner";
import { PhaseName } from "@server/prisma/prisma.client";
import { friendlyPhaseName } from "@sectors/app/helpers";
import { useGame } from "./GameContext";
import { useDrawer } from "../Drawer.context";
import { useKeyboardShortcuts } from "@sectors/app/hooks/useKeyboardShortcuts";
import { GameBoard } from "./Board/GameBoard";

/**
 * The game shell. There is exactly one view — the board — so this only owns the
 * drawer root that order entry hangs off and the phase-change announcements.
 */
const Game = ({ gameId }: { gameId: string }) => {
  const { currentPhase } = useGame();
  const { isOpen: drawerIsOpen, closeDrawer, toggleDrawer } = useDrawer();
  const previousPhaseRef = useRef<PhaseName | undefined>(undefined);

  useEffect(() => {
    if (!currentPhase?.name) return;
    if (currentPhase.name === previousPhaseRef.current) return;
    if (previousPhaseRef.current) {
      toast.success(`Phase: ${friendlyPhaseName(currentPhase.name)}`, {
        duration: 2000,
      });
    }
    previousPhaseRef.current = currentPhase.name;
  }, [currentPhase?.name]);

  useKeyboardShortcuts({
    onEscape: () => {
      if (drawerIsOpen) closeDrawer();
    },
    enabled: true,
  });

  return (
    <Drawer.Root open={drawerIsOpen} onOpenChange={toggleDrawer} direction="right">
      <div className="flex h-full min-h-0 w-full flex-1 flex-col bg-black">
        <GameBoard />
      </div>
    </Drawer.Root>
  );
};

export default Game;
