'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { trpc } from '@sectors/app/trpc';
import { useGame } from '../../Game/GameContext';
import { PhaseName } from '@server/prisma/prisma.client';

interface ResearchSlotProps {
  companyId: string;
  gameId: string;
}

const RESEARCH_COSTS = {
  1: 100, // Stage 1 (researchMarker 0-5)
  2: 200, // Stage 2 (researchMarker 6-10)
  3: 300, // Stage 3 (researchMarker 11-15)
  4: 400, // Stage 4 (researchMarker 16-20)
};

export function ResearchSlot({ companyId, gameId }: ResearchSlotProps) {
  const [showResearchCreation, setShowResearchCreation] = useState(false);
  const { currentPhase } = useGame();

  // Check if we're in the MODERN_OPERATIONS phase
  const isModernOperationsPhase = currentPhase?.name === PhaseName.MODERN_OPERATIONS;

  // Fetch company to get research progress
  const { data: company } = trpc.company.getCompanyWithSector.useQuery({
    id: companyId,
  });

  const { data: gameState } = trpc.game.getGameState.useQuery({
    gameId,
  });

  const utils = trpc.useUtils();
  const submitResearch = trpc.modernOperations.submitResearchAction.useMutation({
    onSuccess: () => {
      setShowResearchCreation(false);
      // Invalidate queries to refresh data
      utils.company.getCompanyWithSector.invalidate({ id: companyId });
      utils.game.getGameState.invalidate({ gameId });
      utils.modernOperations.getPendingResearchOrders.invalidate({ companyId, gameId });
    },
    onError: (error) => {
      console.error('Failed to submit research:', error);
      alert(`Error: ${error.message}`);
    },
  });

  // Calculate research cost based on sector research stage (researchMarker)
  // Research track has 20 spaces divided into 4 stages of 5 spaces each
  // Stage 1: 0-5 ($100), Stage 2: 6-10 ($200), Stage 3: 11-15 ($300), Stage 4: 16-20 ($400)
  const sectorResearchMarker = company?.Sector?.researchMarker || 0;
  const researchStage = Math.min(Math.floor(sectorResearchMarker / 5) + 1, 4);
  const researchCost = RESEARCH_COSTS[researchStage as keyof typeof RESEARCH_COSTS] || 100;
  
  const researchProgress = company?.researchProgress || 0;
  const canResearch = company && company.cashOnHand >= researchCost;

  const handleSlotClick = () => {
    // Only allow clicks during MODERN_OPERATIONS phase
    if (!isModernOperationsPhase) return;
    if (canResearch && !showResearchCreation) {
      setShowResearchCreation(true);
    }
  };

  const handleResearch = async () => {
    if (!company || !company.sectorId) return;
    
    submitResearch.mutate({
      companyId: company.id,
      gameId,
      playerId: company.ceoId || '',
      sectorId: company.sectorId,
    });
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
          researchProgress > 0 && 'border-blue-400 bg-blue-400/20 text-blue-200 cursor-default h-auto min-h-[48px]',
          // Only allow interaction during MODERN_OPERATIONS phase
          isModernOperationsPhase && canResearch && researchProgress === 0
            ? 'border-blue-400/60 bg-blue-400/10 text-blue-300 hover:bg-blue-400/20 h-auto min-h-[48px] cursor-pointer'
            : 'border-gray-600/40 bg-gray-700/30 text-gray-500 cursor-not-allowed h-12',
          // Dim if not in correct phase
          !isModernOperationsPhase && canResearch && researchProgress === 0 && 'opacity-50'
        )}
      >
        {researchProgress > 0 ? (
          <div className="flex flex-col items-center gap-1">
            <div className="text-xs font-bold">Research</div>
            <div className="text-sm font-semibold">{researchProgress}</div>
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
                  Research investment will increase your company's research progress by a random amount (0-2).
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleResearch}
                  disabled={!canResearch || submitResearch.isLoading}
                  className={cn(
                    'flex-1 px-4 py-2 rounded font-medium transition-colors',
                    canResearch && !submitResearch.isLoading
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  )}
                >
                  {submitResearch.isLoading ? 'Processing...' : `Invest $${researchCost}`}
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

