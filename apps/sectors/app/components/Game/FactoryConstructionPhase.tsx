import React from 'react';
import { useGame } from './GameContext';
import { trpc } from '@sectors/app/trpc';
import { ModernCompany } from '../Company/CompanyV2/ModernCompany';
import { FactoryCreation } from '../Company/Factory';

const FactoryConstructionPhase = () => {
  const { gameId, authPlayer, currentPhase } = useGame();
  // Get companies where the current player is CEO
  const { data: companies, isLoading } = trpc.company.listCompanies.useQuery({
    where: { gameId, ceoId: authPlayer?.id },
    orderBy: { name: 'asc' },
  });

  if (isLoading) return <div>Loading your companies...</div>;
  if (!companies || companies.length === 0) return <div>You do not own any companies eligible for factory construction.</div>;

  return (
    <div className="p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Factory Construction</h1>
      <p className="text-gray-400 mb-6">You may construct one factory for each of your companies this phase.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {companies.map((company) => (
          <div key={company.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex flex-col gap-4">
            <ModernCompany companyId={company.id} gameId={gameId} currentPhase={currentPhase?.id || 0} />
            <FactoryCreation
              companyId={company.id}
              gameId={gameId}
              factorySize={'FACTORY_I'}
              onClose={() => {}}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FactoryConstructionPhase; 