"use client";

import { trpc } from "@sectors/app/trpc";
import { FactorySlots } from "../Tableau/FactorySlots";
import { MarketingSlots } from "../Tableau/MarketingSlots";
import { ResearchSlot } from "../Tableau/ResearchSlot";
import { ConstructionOrders } from "../Factory/ConstructionOrders";
import { PendingCampaigns } from "../Marketing/PendingCampaigns";
import { PendingResearchOrders } from "../Research/PendingResearchOrders";
import { Popover, PopoverTrigger, PopoverContent } from "@nextui-org/react";
import { RiInformationLine } from "@remixicon/react";

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
          <Popover placement="right" showArrow>
            <PopoverTrigger>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-300 transition-colors"
                aria-label="Factory information"
              >
                <RiInformationLine size={14} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="bg-gray-900 border border-gray-700 max-w-md">
              <div className="p-4 space-y-3">
                <div className="text-sm font-semibold text-white mb-2">Factory Mechanics Explained</div>
                <div className="text-xs space-y-2 text-gray-300">
                  <p>
                    <strong className="text-white">What are Factories?</strong>
                  </p>
                  <p>
                    Factories are production facilities that manufacture products to serve customers. Each factory has a blueprint (resource types) and workers who operate it.
                  </p>
                  <p>
                    <strong className="text-white">Factory Sizes & Costs:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Factory I:</strong> 2 workers, serves 3 customers, 1 resource type + sector resource</li>
                    <li><strong>Factory II:</strong> 4 workers, serves 4 customers, 2 resource types + sector resource</li>
                    <li><strong>Factory III:</strong> 6 workers, serves 5 customers, 3 resource types + sector resource</li>
                    <li><strong>Factory IV:</strong> 8 workers, serves 6 customers, 4 resource types + sector resource</li>
                  </ul>
                  <p>
                    <strong className="text-white">Construction Cost:</strong>
                  </p>
                  <p>
                    Cost = (Sum of resource prices) × Factory size + $100 plot fee (for fresh plots only). When upgrading an existing factory, the $100 plot fee doesn&apos;t apply.
                  </p>
                  <p>
                    <strong className="text-white">How Factories Work:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Factories built this turn become operational next turn (1 turn delay)</li>
                    <li>Each factory automatically includes 1 sector-specific resource in its blueprint</li>
                    <li>You select additional global resources to complete the blueprint</li>
                    <li>All companies pay the same resource prices (simultaneous pricing prevents front-running)</li>
                    <li>Factory slots are limited by research stage (Stage 1: 2 slots, Stage 2: 3 slots, Stage 3: 4 slots, Stage 4: 5 slots)</li>
                    <li>Customers prefer more complex products (larger factories) when available</li>
                  </ul>
                  <p>
                    <strong className="text-white">Revenue & Profit:</strong>
                  </p>
                  <p>
                    Revenue = customers served × (unit price + sum of resource prices in blueprint). Costs = workers × sector salary. Profit = Revenue - Costs.
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
          <Popover placement="right" showArrow>
            <PopoverTrigger>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-300 transition-colors"
                aria-label="Marketing information"
              >
                <RiInformationLine size={14} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="bg-gray-900 border border-gray-700 max-w-md">
              <div className="p-4 space-y-3">
                <div className="text-sm font-semibold text-white mb-2">Marketing Mechanics Explained</div>
                <div className="text-xs space-y-2 text-gray-300">
                  <p>
                    <strong className="text-white">What are Marketing Campaigns?</strong>
                  </p>
                  <p>
                    Marketing campaigns boost your company&apos;s brand score and add consumption markers to your sector&apos;s consumption bag, increasing demand for your products.
                  </p>
                  <p>
                    <strong className="text-white">Campaign Tiers & Costs:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Tier I:</strong> $100 base + slot penalty, 1 worker, +1 brand score, +1 consumption marker</li>
                    <li><strong>Tier II:</strong> $200 base + slot penalty, 2 workers, +2 brand score, +2 consumption markers</li>
                    <li><strong>Tier III:</strong> $300 base + slot penalty, 3 workers, +3 brand score, +3 consumption markers</li>
                  </ul>
                  <p>
                    <strong className="text-white">Slot Penalty:</strong>
                  </p>
                  <p>
                    Running multiple campaigns simultaneously costs extra: Slot 1 = $0 penalty, Slot 2 = $100, Slot 3 = $200, Slot 4 = $300, Slot 5 = $400. This penalty is added to the base cost.
                  </p>
                  <p>
                    <strong className="text-white">How Marketing Works:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Each campaign requires workers from your company&apos;s workforce</li>
                    <li>You select resource types that add temporary markers to your sector&apos;s consumption bag</li>
                    <li>Brand score improves your attraction rating (lower attraction = better, cheaper to customers)</li>
                    <li>Marketing slots are limited by research stage (Stage 1: 2 slots, Stage 2: 3 slots, Stage 3: 4 slots, Stage 4: 5 slots)</li>
                    <li>Campaigns degrade over time: ACTIVE → DECAYING → EXPIRED (workers return to pool)</li>
                  </ul>
                  <p>
                    <strong className="text-white">Attraction Rating:</strong>
                  </p>
                  <p>
                    Attraction = unit price - brand score. Lower attraction rating means customers prefer your products (cheaper to them). Ties go to more complex factories.
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
          <Popover placement="right" showArrow>
            <PopoverTrigger>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-300 transition-colors"
                aria-label="Research information"
              >
                <RiInformationLine size={14} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="bg-gray-900 border border-gray-700 max-w-md">
              <div className="p-4 space-y-3">
                <div className="text-sm font-semibold text-white mb-2">Research Mechanics Explained</div>
                <div className="text-xs space-y-2 text-gray-300">
                  <p>
                    <strong className="text-white">Primary Function: Unlock Factory Production Tiers</strong>
                  </p>
                  <p>
                    The main purpose of research is to unlock higher tiers for factory production. As your sector advances through research stages, companies gain access to larger, more efficient factories.
                  </p>
                  <p>
                    <strong className="text-white">Factory Tier Unlocking:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Stage 1 (0-3):</strong> Only Factory I available</li>
                    <li><strong>Stage 2 (4-6):</strong> Factory I and Factory II unlocked</li>
                    <li><strong>Stage 3 (7-9):</strong> Factory II and Factory III unlocked</li>
                    <li><strong>Stage 4 (10-12+):</strong> Factory III and Factory IV unlocked</li>
                  </ul>
                  <p>
                    <strong className="text-white">Research Costs:</strong>
                  </p>
                  <p>
                    Research costs increase with sector research stage: Stage 1 = $100, Stage 2 = $200, Stage 3 = $300, Stage 4 = $400. Each research action requires 1 worker.
                  </p>
                  <p>
                    <strong className="text-white">Research Progress:</strong>
                  </p>
                  <p>
                    Each research action yields random progress gain of +1 or +2. Companies contribute to their sector&apos;s shared research track (12 spaces total, 4 stages of 3 spaces each).
                  </p>
                  <p>
                    <strong className="text-white">Additional Benefits:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Each research action performed adds 1 demand counter to Forecast Quarter 2</li>
                    <li>Demand bonuses: Stage 1 = +0, Stage 2 = +2, Stage 3 = +3, Stage 4 = +5</li>
                    <li>Reaching research stages unlocks more factory and marketing slots</li>
                  </ul>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="pl-3">
          <ResearchSlot
            companyId={companyId}
            gameId={gameId}
            isCEO={isCEO}
          />
        </div>
      </div>

      {/* Construction Orders & History - Visible to all players (not just CEO) */}
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
