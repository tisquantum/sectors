'use client';

import { Card, CardBody } from '@nextui-org/react';
import { RiBuilding2Line, RiCheckLine } from '@remixicon/react';
import { sectorColors } from '@server/data/gameData';

const THRESHOLDS = [2, 4, 8] as const;

export interface SectorWithThresholds {
  id: string;
  name: string;
  sectorName?: string;
  demand?: number | null;
  demandThreshold2Reached?: boolean | null;
  demandThreshold4Reached?: boolean | null;
  demandThreshold8Reached?: boolean | null;
  pendingNewCompanyAt2?: boolean | null;
  pendingNewCompanyAt4?: boolean | null;
  pendingNewCompanyAt8?: boolean | null;
}

interface NewCompanyDemandThresholdsProps {
  sectors: SectorWithThresholds[];
}

/**
 * Visual for new company demand thresholds (2, 4, 8).
 * Shows per sector: current demand and which thresholds are reached or pending (company opens next turn).
 */
export function NewCompanyDemandThresholds({ sectors }: NewCompanyDemandThresholdsProps) {
  return (
    <Card className="bg-gray-800/50 border border-gray-700">
      <CardBody className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <RiBuilding2Line size={20} className="text-amber-400" />
          <h3 className="text-lg font-semibold text-white">New Company Thresholds</h3>
        </div>
        <p className="text-sm text-gray-400 mb-3 max-w-md">
          A new company opens in a sector at the <strong className="text-gray-300">start of the next turn</strong> when sector demand first reaches 2, 4, or 8. Each threshold triggers once per sector (max 4 companies per sector).
        </p>
        <div className="flex gap-4 mb-3 text-xs text-gray-500">
          {THRESHOLDS.map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className="font-medium text-gray-400">Demand {t}:</span> new company
            </span>
          ))}
        </div>
        <div className="space-y-2">
          {sectors.map((sector) => {
            const demand = sector.demand ?? 0;
            const name = sector.name || (sector.sectorName as string) || 'Sector';
            const color = sectorColors[name] ?? '#6b7280';
            return (
              <div
                key={sector.id}
                className="flex items-center justify-between p-2.5 bg-gray-900/50 rounded-lg border border-gray-700"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-white font-medium text-sm">{name}</span>
                  <span className="text-gray-500 text-sm">Demand: {demand}</span>
                </div>
                <div className="flex items-center gap-4">
                  {THRESHOLDS.map((t) => {
                    const reached = t === 2 ? sector.demandThreshold2Reached : t === 4 ? sector.demandThreshold4Reached : sector.demandThreshold8Reached;
                    const pending = t === 2 ? sector.pendingNewCompanyAt2 : t === 4 ? sector.pendingNewCompanyAt4 : sector.pendingNewCompanyAt8;
                    const met = demand >= t;
                    return (
                      <div
                        key={t}
                        className="flex items-center gap-1 min-w-[4rem]"
                        title={
                          reached
                            ? `Threshold ${t} reached (company opened)`
                            : pending
                              ? `Threshold ${t} met — company opens next turn`
                              : met
                                ? `Demand ≥ ${t}`
                                : `${demand}/${t}`
                        }
                      >
                        {reached ? (
                          <RiCheckLine className="text-green-500 flex-shrink-0" size={18} />
                        ) : pending ? (
                          <span className="text-amber-400 font-medium text-xs">Next turn</span>
                        ) : met ? (
                          <RiCheckLine className="text-green-500/70 flex-shrink-0" size={18} />
                        ) : (
                          <span className="text-gray-500 text-xs">{demand}/{t}</span>
                        )}
                        <span className="text-gray-500 text-xs hidden sm:inline">@{t}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
