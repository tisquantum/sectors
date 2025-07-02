'use client';

import { useGame } from './GameContext';
import { Card, CardBody, CardHeader, Chip } from '@nextui-org/react';
import { ResearchTrack } from '../Company/Research/ResearchTrack';

export default function MarketingAndResearchActionResolve() {
  const { gameState, currentPhase } = useGame();

  // Get all companies that participated in this phase
  const companies = gameState.Company.filter(company => 
    company.status === 'ACTIVE' && company.isFloated
  );

  const currentPhaseNumber = Math.ceil(Number(currentPhase?.name?.match(/\d+/)?.[0] || '1'));

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-200 mb-2">Marketing & Research Results</h1>
        <p className="text-gray-400">
          Phase {currentPhaseNumber} - Resolving all marketing campaigns and research advances
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Marketing Results */}
        <Card className="bg-gray-800/50 border border-gray-700">
          <CardHeader className="pb-3">
            <h2 className="text-xl font-semibold text-gray-200">Marketing Campaigns</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {companies.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No companies participated in marketing</p>
            ) : (
              companies.map((company) => (
                <div key={company.id} className="p-4 bg-gray-700/30 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-200">{company.name}</h3>
                      <p className="text-sm text-gray-400">{company.stockSymbol}</p>
                    </div>
                    <Chip 
                      color="primary" 
                      variant="flat" 
                      size="sm"
                    >
                      CEO: {gameState.Player.find(p => p.id === company.ceoId)?.nickname || 'Unknown'}
                    </Chip>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Brand Score:</span>
                      <span className="text-gray-200 font-medium">
                        {company.brandScore} (+{company.brandScore - (company.brandScore || 0)})
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Active Campaigns:</span>
                      <span className="text-gray-200 font-medium">
                        {/* TODO: Add marketing campaigns to GameState type */}
                        0
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Brand Bonus:</span>
                      <span className="text-green-400 font-medium">
                        {/* TODO: Add marketing campaigns to GameState type */}
                        +0
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Research Results */}
        <Card className="bg-gray-800/50 border border-gray-700">
          <CardHeader className="pb-3">
            <h2 className="text-xl font-semibold text-gray-200">Research Advances</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {companies.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No companies participated in research</p>
            ) : (
              companies.map((company) => (
                <div key={company.id} className="p-4 bg-gray-700/30 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-200">{company.name}</h3>
                      <p className="text-sm text-gray-400">{company.stockSymbol}</p>
                    </div>
                    <Chip 
                      color="secondary" 
                      variant="flat" 
                      size="sm"
                    >
                      CEO: {gameState.Player.find(p => p.id === company.ceoId)?.nickname || 'Unknown'}
                    </Chip>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Research Progress:</span>
                      <span className="text-gray-200 font-medium">
                        {company.researchProgress || 0} spaces
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Research Grants:</span>
                      <span className="text-blue-400 font-medium">
                        {company.researchGrants || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Market Favors:</span>
                      <span className="text-purple-400 font-medium">
                        {company.marketFavors || 0}
                      </span>
                    </div>
                                         <div className="flex justify-between text-sm">
                       <span className="text-gray-400">Sector:</span>
                       <span className="text-gray-200 font-medium">
                         {gameState.sectors.find((s: any) => s.id === company.sectorId)?.name || 'Unknown'}
                       </span>
                     </div>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      {/* Sector Research Tracks */}
      <Card className="bg-gray-800/50 border border-gray-700">
        <CardHeader className="pb-3">
          <h2 className="text-xl font-semibold text-gray-200">Sector Research Tracks</h2>
        </CardHeader>
        <CardBody className="space-y-6">
          {gameState.sectors.map((sector: any) => (
            <div key={sector.id} className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-200">{sector.name}</h3>
                <div className="flex gap-2">
                  <Chip size="sm" color="primary" variant="flat">
                    Technology Level: {sector.technologyLevel || 0}
                  </Chip>
                  <Chip size="sm" color="secondary" variant="flat">
                    Research Marker: {sector.researchMarker || 0}
                  </Chip>
                </div>
              </div>
              
              <ResearchTrack
                currentProgress={sector.researchMarker || 0}
                currentPhase={currentPhaseNumber}
                spaces={Array.from({ length: 20 }, (_, i) => ({
                  id: `sector-${sector.id}-space-${i + 1}`,
                  number: i + 1,
                  phase: Math.ceil((i + 1) / 5),
                  isUnlocked: i < 20,
                  hasReward: (i + 1) % 5 === 0,
                  reward: (i + 1) % 5 === 0 ? {
                    type: 'GRANT' as const,
                    amount: Math.ceil((i + 1) / 5) * 100,
                  } : undefined,
                }))}
              />
              
              <div className="text-sm text-gray-400">
                Companies in this sector: {
                  companies.filter(c => c.sectorId === sector.id).length
                }
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Summary */}
      <Card className="bg-gray-800/50 border border-gray-700">
        <CardHeader className="pb-3">
          <h2 className="text-xl font-semibold text-gray-200">Phase Summary</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-700/30 rounded-lg">
              <div className="text-2xl font-bold text-gray-200">
                {companies.length}
              </div>
              <div className="text-sm text-gray-400">Companies Participated</div>
            </div>
            
            <div className="text-center p-4 bg-gray-700/30 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {/* TODO: Add marketing campaigns to GameState type */}
                0
              </div>
              <div className="text-sm text-gray-400">Total Brand Bonus</div>
            </div>
            
            <div className="text-center p-4 bg-gray-700/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {companies.reduce((sum, c) => sum + (c.researchProgress || 0), 0)}
              </div>
              <div className="text-sm text-gray-400">Total Research Progress</div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
} 