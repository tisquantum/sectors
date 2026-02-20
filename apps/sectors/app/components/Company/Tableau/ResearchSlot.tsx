'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { trpc } from '@sectors/app/trpc';
import { useGame } from '../../Game/GameContext';
import { PhaseName, CompanyStatus } from '@server/prisma/prisma.client';
import { RiErrorWarningFill } from '@remixicon/react';

function getSubmitErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  const e = error as { message?: string; data?: { json?: { message?: string }; message?: string } };
  if (typeof e?.message === 'string') return e.message;
  if (typeof e?.data?.json?.message === 'string') return e.data.json.message;
  if (typeof e?.data?.message === 'string') return e.data.message;
  return 'Failed to submit research.';
}

interface ResearchSlotProps {
  companyId: string;
  gameId: string;
  isCEO?: boolean;
}

const RESEARCH_COSTS = {
  1: 100, // Stage 1 (researchMarker 0-3)
  2: 200, // Stage 2 (researchMarker 4-6)
  3: 300, // Stage 3 (researchMarker 7-9)
  4: 400, // Stage 4 (researchMarker 10-12)
};

export function ResearchSlot({ companyId, gameId, isCEO = false }: ResearchSlotProps) {
  const [showResearchCreation, setShowResearchCreation] = useState(false);
  const { currentPhase, currentTurn } = useGame();

  // Check if we're in the MODERN_OPERATIONS phase
  const isModernOperationsPhase = currentPhase?.name === PhaseName.MODERN_OPERATIONS;

  // Fetch company to get research progress
  const { data: company } = trpc.company.getCompanyWithSector.useQuery({
    id: companyId,
  });

  const { data: gameState } = trpc.game.getGameState.useQuery({
    gameId,
  });

  const [researchError, setResearchError] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const submitResearch = trpc.modernOperations.submitResearchAction.useMutation({
    onSuccess: () => {
      setShowResearchCreation(false);
      setResearchError(null);
      // Invalidate queries to refresh data
      utils.company.getCompanyWithSector.invalidate({ id: companyId });
      utils.game.getGameState.invalidate({ gameId });
      utils.modernOperations.getPendingResearchOrders.invalidate({ companyId, gameId });
    },
  });

  // Calculate research cost based on sector research stage (researchMarker)
  // Research track has 12 spaces divided into 4 stages of 3 spaces each
  // Stage 1: 0-3 ($100), Stage 2: 4-6 ($200), Stage 3: 7-9 ($300), Stage 4: 10-12 ($400)
  const sectorResearchMarker = company?.Sector?.researchMarker || 0;
  const researchStage = Math.min(Math.floor(sectorResearchMarker / 3) + 1, 4);
  const researchCost = RESEARCH_COSTS[researchStage as keyof typeof RESEARCH_COSTS] || 100;
  
  const researchProgress = company?.researchProgress || 0;
  const canResearch = company && company.cashOnHand >= researchCost;

  // Pending research orders this turn = CEO has already taken a research action this turn
  const { data: pendingOrders } = trpc.modernOperations.getPendingResearchOrders.useQuery(
    { companyId, gameId, gameTurnId: currentTurn?.id },
    { enabled: !!currentTurn?.id && !!companyId && !!gameId }
  );
  const hasTakenResearchThisTurn = (pendingOrders?.length ?? 0) > 0;
  const canTakeResearchThisTurn = canResearch && !hasTakenResearchThisTurn;

  // Get research workers count (each research order = 1 worker)
  const { data: researchWorkers = 0 } = trpc.modernOperations.getResearchWorkers.useQuery(
    {
      companyId,
      gameId,
    },
    { enabled: !!companyId && !!gameId }
  );

  const handleSlotClick = () => {
    // Only allow clicks during MODERN_OPERATIONS phase and if user is CEO
    if (!isModernOperationsPhase || !isCEO) return;
    // Only active or insolvent companies can operate
    if (company?.status !== CompanyStatus.ACTIVE && company?.status !== CompanyStatus.INSOLVENT) return;
    // Only open modal if can afford research and haven't already taken a research action this turn
    if (canTakeResearchThisTurn && !showResearchCreation) {
      setResearchError(null);
      setShowResearchCreation(true);
    }
  };

  const handleResearch = async () => {
    if (!company || !company.sectorId) return;

    setResearchError(null);

    try {
      await submitResearch.mutateAsync({
        companyId: company.id,
        gameId,
        playerId: company.ceoId || '',
        sectorId: company.sectorId,
      });
    } catch (error) {
      console.error('Failed to submit research:', error);
      setResearchError(getSubmitErrorMessage(error));
    }
  };

  const handleCloseResearchError = () => {
    setResearchError(null);
    setShowResearchCreation(false);
  };

  if (!company) {
    return (
      <div className="w-full h-8 rounded border border-gray-600/40 bg-gray-700/30 animate-pulse" />
    );
  }

  return (
    <>
      <div
        onClick={handleSlotClick}
        className={cn(
          'relative w-full rounded border transition-all flex flex-col items-center justify-center p-2',
          // Enabled: CEO, in phase, company can act, and haven't taken a research action this turn
          isModernOperationsPhase && isCEO && (company?.status === CompanyStatus.ACTIVE || company?.status === CompanyStatus.INSOLVENT) && canTakeResearchThisTurn
            ? 'border-blue-400/60 bg-blue-400/10 text-blue-300 hover:bg-blue-400/20 h-auto min-h-[48px] cursor-pointer'
            : researchProgress > 0
              ? 'border-blue-400 bg-blue-400/20 text-blue-200 cursor-default h-auto min-h-[48px]'
              : 'border-gray-600/40 bg-gray-700/30 text-gray-500 cursor-not-allowed h-12',
          // Dim if not in correct phase or not CEO
          (!isModernOperationsPhase || !isCEO) && 'opacity-50'
        )}
      >
        {researchProgress > 0 ? (
          <div className="flex flex-col items-center gap-1">
            <div className="text-xs font-bold">Research</div>
            <div className="text-sm font-semibold">{researchProgress}</div>
            {researchWorkers > 0 && (
              <div className="flex items-center gap-1 text-xs text-blue-300">
                <span>👷</span>
                <span>{researchWorkers}</span>
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs font-medium">Research</span>
        )}
      </div>
      {showResearchCreation && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Invest in Research</h3>
            <div className="space-y-4">
              <div className="text-gray-300">
                <p>Current Research Progress: <span className="font-semibold">{researchProgress}</span></p>
                <p>Cost: <span className="font-semibold">${researchCost}</span></p>
                <p className="text-sm text-gray-400 mt-2">
                  Research investment will increase your company&apos;s research progress by a random amount (0-2).
                </p>
              </div>

              {researchError && (
                <div className="rounded-lg border border-red-700/50 bg-red-900/20 p-4 space-y-3">
                  <div className="flex gap-3">
                    <RiErrorWarningFill className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <div className="text-sm font-semibold text-red-300">Research failed</div>
                      <p className="text-sm text-red-200/90 mt-1">{researchError}</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleCloseResearchError}
                      className="px-4 py-2 rounded-lg bg-red-700/50 hover:bg-red-700/70 border border-red-600/50 text-red-100 font-medium transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleResearch}
                  disabled={!canResearch || submitResearch.isPending}
                  className={cn(
                    'flex-1 px-4 py-2 rounded font-medium transition-colors',
                    canResearch && !submitResearch.isPending
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  )}
                >
                  {submitResearch.isPending ? 'Processing...' : `Invest $${researchCost}`}
                </button>
                <button
                  onClick={() => setShowResearchCreation(false)}
                  className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
              {!canResearch && (
                <p className="text-red-400 text-sm">
                  Insufficient funds. You need ${researchCost} but have ${company.cashOnHand}.
                </p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

