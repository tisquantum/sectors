'use client';

import { useMemo } from 'react';
import { trpc } from '@sectors/app/trpc';
import { useGame } from '../../Game/GameContext';
import { ResourceIcon } from '../../Game/ConsumptionPhase/ResourceIcon';
import { Spinner, Chip } from '@nextui-org/react';
import { RiTimeLine, RiMegaphoneFill } from '@remixicon/react';
import { ResourceType } from '../Factory/Factory.types';
import { PhaseName } from '@server/prisma/prisma.client';

interface PendingCampaignsProps {
  companyId: string;
  gameId: string;
}

/**
 * Component to display pending marketing campaigns (created this turn, not yet resolved)
 */
export function PendingCampaigns({ companyId, gameId }: PendingCampaignsProps) {
  const { currentTurn, currentPhase } = useGame();

  // Only show pending campaigns during MODERN_OPERATIONS phase
  const isModernOperationsPhase = currentPhase?.name === PhaseName.MODERN_OPERATIONS;

  // Get pending campaigns (created this turn)
  const { data: pendingCampaigns, isLoading: campaignsLoading } = trpc.marketing.getPendingCampaigns.useQuery(
    {
      companyId,
      gameId,
      gameTurnId: currentTurn?.id,
    },
    { enabled: !!currentTurn?.id && isModernOperationsPhase }
  );

  if (!isModernOperationsPhase) {
    return null; // Don't show pending campaigns outside of MODERN_OPERATIONS phase
  }

  if (campaignsLoading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Spinner size="sm" />
      </div>
    );
  }

  if (!pendingCampaigns || pendingCampaigns.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wide">
        <RiTimeLine size={16} />
        <span>Pending Campaigns</span>
        <Chip size="sm" variant="flat" color="secondary" className="ml-auto">
          {pendingCampaigns.length}
        </Chip>
      </div>
      <div className="space-y-2 pl-4 border-l-2 border-purple-500/30">
        {pendingCampaigns.map((campaign) => {
          const tierLabel = campaign.tier.replace('TIER_', '');
          
          return (
            <div
              key={campaign.id}
              className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2 space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RiMegaphoneFill size={14} className="text-purple-400" />
                  <span className="text-xs font-medium text-purple-300">
                    Campaign {tierLabel}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(campaign.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">
                  Workers: <span className="text-gray-300">{campaign.workers}</span>
                </span>
                <span className="text-xs text-gray-400">
                  Brand: <span className="text-purple-300">+{campaign.brandBonus}</span>
                </span>
                {(campaign.resourceTypes as ResourceType[])?.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">Resources:</span>
                    {(campaign.resourceTypes as ResourceType[]).map((type, idx) => (
                      <ResourceIcon key={idx} resourceType={type} size="w-4 h-4" />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  Status: <span className="text-purple-300">Pending Resolution</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

