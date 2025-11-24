"use client";

import { trpc } from "@sectors/app/trpc";
import { FactorySlots } from "../Tableau/FactorySlots";
import { MarketingSlots } from "../Tableau/MarketingSlots";
import { ResearchSlot } from "../Tableau/ResearchSlot";
import { ConstructionOrders } from "../Factory/ConstructionOrders";
import { PendingCampaigns } from "../Marketing/PendingCampaigns";
import { PendingResearchOrders } from "../Research/PendingResearchOrders";

interface ModernCompanyProps {
  companyId: string;
  gameId: string;
  currentPhase?: string;
  isCEO?: boolean;
}

export function ModernCompany({
  companyId,
  gameId,
  currentPhase,
  isCEO = false,
}: ModernCompanyProps) {
  const { data: company } = trpc.company.getCompanyWithSector.useQuery({
    id: companyId,
  });

  // Allow component to render without currentPhase (for always-available views)
  // currentPhase is only needed for phase-specific factory creation, not viewing

  return (
    <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-600 shadow-lg p-3 space-y-3 min-w-[280px]">
      {/* Compact Factory Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-1 text-xs font-medium text-gray-200">
          <div className="w-2 h-2 bg-orange-400 rounded"></div>
          Factories
        </div>
        <div className="pl-3">
          <FactorySlots
            companyId={companyId}
            gameId={gameId}
            isCEO={isCEO}
          />
        </div>
      </div>

      {/* Compact Marketing Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-1 text-xs font-medium text-gray-200">
          <div className="w-2 h-2 bg-purple-400 rounded"></div>
          Marketing
        </div>
        <div className="pl-3">
          <MarketingSlots
            companyId={companyId}
            gameId={gameId}
            isCEO={isCEO}
          />
        </div>
      </div>

      {/* Compact Research Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-1 text-xs font-medium text-gray-200">
          <div className="w-2 h-2 bg-blue-400 rounded"></div>
          Research
        </div>
        <div className="pl-3">
          <ResearchSlot
            companyId={companyId}
            gameId={gameId}
            isCEO={isCEO}
          />
        </div>
      </div>

      {/* Construction Orders & History */}
      <div className="space-y-2 pt-2 border-t border-gray-700">
        <ConstructionOrders companyId={companyId} gameId={gameId} showHistory={false} />
      </div>

      {/* Pending Marketing Campaigns */}
      <div className="space-y-2 pt-2 border-t border-gray-700">
        <PendingCampaigns companyId={companyId} gameId={gameId} />
      </div>

      {/* Pending Research Orders */}
      <div className="space-y-2 pt-2 border-t border-gray-700">
        <PendingResearchOrders companyId={companyId} gameId={gameId} />
      </div>
    </div>
  );
}
