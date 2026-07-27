"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, useDisclosure } from "@nextui-org/react";
import {
  CompanyStatus,
  GameStatus,
  OperationMechanicsVersion,
} from "@server/prisma/prisma.client";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "../GameContext";
import GameResults from "../GameResults";
import { BoardPlayerBar } from "./BoardPlayerBar";
import { BoardWorkforceStrip } from "./BoardWorkforceStrip";
import { BoardStockStrip } from "./BoardStockStrip";
import { BoardResourceColumns } from "./BoardResourceColumns";
import { BoardResearchColumns } from "./BoardResearchColumns";
import { BoardSectorMap } from "./BoardSectorMap";
import { BoardActionDock } from "./BoardActionDock";
import { BoardCompanyModal } from "./BoardCompanyModal";
import { BoardOrderModal, type OrderTarget } from "./BoardOrderModal";
import { focusLevelFor, getBoardFocus } from "./boardFocus";

/**
 * The whole game on one screen. Nothing is behind a tab: the player's position
 * sits on top, the two horizontal tracks beneath it, the column tracks below
 * those, and the sector map fills the rest. Interaction happens through
 * contextual modals opened from whatever you press.
 */
export function GameBoard() {
  const { gameId, gameState, currentPhase } = useGame();
  const boardRef = useRef<HTMLDivElement>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [orderTarget, setOrderTarget] = useState<OrderTarget | null>(null);
  const results = useDisclosure();

  const { data: companies, refetch: refetchCompanies } =
    trpc.company.listCompaniesWithRelations.useQuery(
      { where: { gameId } },
      {
        enabled: !!gameId,
        staleTime: 10000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      }
    );

  useEffect(() => {
    refetchCompanies();
  }, [currentPhase?.id, refetchCompanies]);

  useEffect(() => {
    if (gameState.gameStatus === GameStatus.FINISHED) results.onOpen();
    // Opening once when the game ends is the intent; results.onOpen is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.gameStatus]);

  const focus = useMemo(
    () => getBoardFocus(currentPhase?.name),
    [currentPhase?.name]
  );

  const isModern =
    gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN;

  const listedCompanies = useMemo(
    () =>
      (companies ?? []).filter(
        (company) => company.status !== CompanyStatus.BANKRUPT
      ),
    [companies]
  );

  return (
    <div
      ref={boardRef}
      className="flex h-full min-h-0 w-full flex-col gap-1.5 overflow-y-auto bg-black p-1.5 scrollbar 2xl:overflow-hidden"
    >
      <BoardPlayerBar focus={focusLevelFor(focus, "players")} />

      {isModern && (
        <BoardWorkforceStrip focus={focusLevelFor(focus, "workforce")} />
      )}

      <BoardStockStrip
        companies={listedCompanies}
        focus={focusLevelFor(focus, "stocks")}
        onSelectCompany={setSelectedCompanyId}
      />

      {isModern && (
        <div className="grid shrink-0 grid-cols-1 gap-1.5 xl:grid-cols-2">
          <BoardResourceColumns focus={focusLevelFor(focus, "resources")} />
          <BoardResearchColumns focus={focusLevelFor(focus, "research")} />
        </div>
      )}

      <BoardSectorMap
        companies={listedCompanies}
        focus={focusLevelFor(focus, "companies")}
        onSelectCompany={setSelectedCompanyId}
        onPlaceOrder={setOrderTarget}
      />

      <BoardActionDock focus={focus} />

      {gameState.gameStatus === GameStatus.FINISHED && (
        <>
          <Button
            color="primary"
            className="shrink-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
            onPress={results.onOpen}
          >
            The game has ended — view results
          </Button>
          <GameResults
            isOpen={results.isOpen}
            onOpen={results.onOpen}
            onClose={results.onClose}
            onOpenChange={results.onOpenChange}
          />
        </>
      )}

      <BoardCompanyModal
        companyId={selectedCompanyId}
        onClose={() => setSelectedCompanyId(null)}
      />
      <BoardOrderModal
        target={orderTarget}
        onClose={() => setOrderTarget(null)}
      />
    </div>
  );
}

export default GameBoard;
