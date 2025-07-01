'use client';

import { trpc } from "@sectors/app/trpc";
import { useGame } from "../GameContext";
import {
  Company,
  CompanyStatus,
  RevenueDistribution,
  Sector,
  SectorName,
} from "@server/prisma/prisma.client";
import { Radio, RadioGroup, Tooltip } from "@nextui-org/react";
import { useState } from "react";
import { CompanyTierData } from "@server/data/constants";
import CompanyInfo from "../../Company/CompanyInfo";
import ShareHolders from "../../Company/ShareHolders";
import DebounceButton from "@sectors/app/components/General/DebounceButton";
import { CompanyWithSector } from "@server/prisma/prisma.types";
import {
  baseToolTipStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";
import CompanyPriorityList from "../../Company/CompanyPriorityOperatingRound";
import { Info } from "lucide-react";
import { OperationMechanicsVersion } from "@server/prisma/prisma.client";

// Mock data for consumption phase revenue - this would come from the backend
interface ConsumptionRevenue {
  companyId: string;
  revenue: number;
  consumersReceived: number;
  factories: {
    id: string;
    size: string;
    profit: number;
    consumersReceived: number;
    maxConsumers: number;
  }[];
}

const mockConsumptionRevenue: ConsumptionRevenue[] = [
  {
    companyId: '1',
    revenue: 850,
    consumersReceived: 12,
    factories: [
      {
        id: 'f1',
        size: 'FACTORY_I',
        profit: 250,
        consumersReceived: 4,
        maxConsumers: 5
      },
      {
        id: 'f2',
        size: 'FACTORY_II',
        profit: 350,
        consumersReceived: 3,
        maxConsumers: 3
      },
      {
        id: 'f3',
        size: 'FACTORY_I',
        profit: 250,
        consumersReceived: 5,
        maxConsumers: 5
      }
    ]
  },
  {
    companyId: '2',
    revenue: 720,
    consumersReceived: 8,
    factories: [
      {
        id: 'f4',
        size: 'FACTORY_I',
        profit: 320,
        consumersReceived: 4,
        maxConsumers: 4
      },
      {
        id: 'f5',
        size: 'FACTORY_II',
        profit: 400,
        consumersReceived: 4,
        maxConsumers: 4
      }
    ]
  },
  {
    companyId: '3',
    revenue: 680,
    consumersReceived: 6,
    factories: [
      {
        id: 'f6',
        size: 'FACTORY_I',
        profit: 280,
        consumersReceived: 3,
        maxConsumers: 4
      },
      {
        id: 'f7',
        size: 'FACTORY_III',
        profit: 400,
        consumersReceived: 3,
        maxConsumers: 3
      }
    ]
  },
  {
    companyId: '4',
    revenue: 920,
    consumersReceived: 10,
    factories: [
      {
        id: 'f8',
        size: 'FACTORY_II',
        profit: 420,
        consumersReceived: 4,
        maxConsumers: 4
      },
      {
        id: 'f9',
        size: 'FACTORY_II',
        profit: 500,
        consumersReceived: 6,
        maxConsumers: 6
      }
    ]
  },
  {
    companyId: '5',
    revenue: 550,
    consumersReceived: 7,
    factories: [
      {
        id: 'f10',
        size: 'FACTORY_I',
        profit: 200,
        consumersReceived: 3,
        maxConsumers: 4
      },
      {
        id: 'f11',
        size: 'FACTORY_I',
        profit: 350,
        consumersReceived: 4,
        maxConsumers: 4
      }
    ]
  }
];

const DistributeSelectionV2 = ({
  company,
  consumptionRevenue,
  operatingRoundId,
}: {
  company: Company & { Sector: Sector };
  consumptionRevenue: ConsumptionRevenue;
  operatingRoundId: string;
}) => {
  const { authPlayer, gameId } = useGame();
  const [isSubmit, setIsSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<RevenueDistribution>(
    RevenueDistribution.DIVIDEND_FULL
  );

  const useVoteRevenueDistributionMutation =
    trpc.revenueDistributionVote.createRevenueDistributionVote.useMutation({
      onSettled: () => {
        setIsLoading(false);
        setIsSubmit(true);
      },
    });

  const handleSubmit = async () => {
    if (!authPlayer) {
      return;
    }
    setIsLoading(true);
    //submit vote
    useVoteRevenueDistributionMutation.mutate({
      operatingRoundId: operatingRoundId,
      productionResultId: 0, // This would need to be updated for consumption revenue
      playerId: authPlayer.id || "",
      companyId: company.id,
      revenueDistribution: selected,
      gameId,
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <RadioGroup
        orientation="horizontal"
        value={selected}
        onValueChange={(value) => setSelected(value as RevenueDistribution)}
      >
        <Radio value={RevenueDistribution.DIVIDEND_FULL}>Dividend Full</Radio>
        <Radio value={RevenueDistribution.DIVIDEND_FIFTY_FIFTY}>
          Dividend Half
        </Radio>
        <Radio value={RevenueDistribution.RETAINED}>Company Retains</Radio>
      </RadioGroup>
      {isSubmit ? (
        <div className="text-green-400 text-sm">Vote Submitted</div>
      ) : (
        <DebounceButton onClick={handleSubmit} isLoading={isLoading}>
          Submit Vote
        </DebounceButton>
      )}
    </div>
  );
};

const OperatingRoundRevenueVoteV2 = () => {
  // For testing: always show mock data, ignore backend
  return (
    <div className="p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Consumption Phase Revenue Vote</h1>
      <p className="text-gray-400 mb-4">
        Vote on how to distribute revenue earned from consumer consumption
      </p>
      <div className="flex flex-col gap-4">
        {mockConsumptionRevenue.map((company) => {
          // Minimal mock company object for voting UI
          const mockCompany = {
            id: company.companyId,
            name: `Company ${company.companyId}`,
            companyTier: 'STARTUP',
            Sector: { id: 'sector1', name: 'CONSUMER_DEFENSIVE' },
            Share: [],
          } as Company & { Sector: Sector };
          const mockOperatingRoundId = 'mock-op-round-1';
          return (
            <div key={company.companyId} className="flex flex-col bg-slate-800 p-4 rounded-lg shadow-md border border-gray-700">
              <div className="flex flex-col gap-2">
                <span className="text-lg font-semibold text-white">Company {company.companyId}</span>
                <span className="text-green-400 font-bold">Revenue: ${company.revenue}</span>
                <span className="text-md my-2 text-gray-300">
                  Consumers Received: {company.consumersReceived}
                </span>
                {/* Factory Breakdown */}
                <div className="space-y-2 mt-2">
                  <span className="text-sm font-medium text-gray-300">Factory Performance:</span>
                  {company.factories.map((factory) => (
                    <div key={factory.id} className="flex justify-between items-center bg-gray-800 rounded p-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-300">{factory.size.replace('_', ' ')}</span>
                        <span className="text-xs text-blue-400">{factory.consumersReceived}/{factory.maxConsumers} consumers</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-green-400 font-bold">${factory.profit}</span>
                        <span className="text-xs text-gray-400">{((factory.consumersReceived / factory.maxConsumers) * 100).toFixed(0)}% capacity</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Voting UI */}
                <div className="mt-4">
                  <DistributeSelectionV2
                    company={mockCompany}
                    consumptionRevenue={company}
                    operatingRoundId={mockOperatingRoundId}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OperatingRoundRevenueVoteV2; 