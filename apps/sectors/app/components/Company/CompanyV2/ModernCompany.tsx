"use client";

import { trpc } from "@sectors/app/trpc";
import { FactorySlots } from "../Tableau/FactorySlots";
import { MarketingSlots } from "../Tableau/MarketingSlots";

interface ModernCompanyProps {
  companyId: string;
  gameId: string;
  currentPhase: number;
}

export function ModernCompany({
  companyId,
  gameId,
  currentPhase,
}: ModernCompanyProps) {
  const { data: company } = trpc.company.getCompanyWithSector.useQuery({
    id: companyId,
  });

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
            currentPhase={currentPhase}
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
            currentPhase={currentPhase}
          />
        </div>
      </div>
    </div>
  );
}
