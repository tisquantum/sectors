'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@nextui-org/react';
import { RiPlayFill, RiPauseFill, RiSkipForwardFill, RiRestartLine, RiTeamFill } from '@remixicon/react';
import { ConsumerFlowPerSectorProps, Company, Factory, FlowLogEntry } from './types';
import { ResourceIcon } from './ResourceIcon';
import { FACTORY_CUSTOMER_LIMITS } from '@server/data/constants';
import { FactorySize } from '@server/prisma/prisma.client';

interface AnimationStep {
  step: number;
  sectorId: string;
  sectorName: string;
  markerDrawn: {
    resourceType: string;
    isPermanent: boolean;
  } | null;
  customerAssigned: {
    factoryId: string;
    companyName: string;
    factorySize: string;
    reason: string;
  } | null;
  factoryStates: Map<string, { current: number; max: number }>;
}

interface AnimatedConsumptionFlowProps extends ConsumerFlowPerSectorProps {
  flowLog: FlowLogEntry[];
  consumptionBags: Array<{
    id: string;
    sectorId: string;
    resourceType: string;
    isPermanent: boolean;
  }>;
  sectors: Array<{ id: string; name: string; consumers: number }>;
}

export function AnimatedConsumptionFlow({
  sectors,
  companies,
  flowLog,
  consumptionBags,
}: AnimatedConsumptionFlowProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(800); // ms per step

  // Build animation steps from flow log
  const animationSteps = useMemo(() => {
    const steps: AnimationStep[] = [];
    const factoryStates = new Map<string, { current: number; max: number }>();

    // Initialize factory states
    companies.forEach(company => {
      company.factories.forEach(factory => {
        factoryStates.set(factory.id, { current: 0, max: factory.maxConsumers });
      });
    });

    // Group flow log entries by timestamp and create steps
    let stepIndex = 0;
    const sortedLog = [...flowLog].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Get sector info from companies
    const sectorMap = new Map<string, { id: string; name: string }>();
    companies.forEach(company => {
      sectors.forEach(sector => {
        if (!sectorMap.has(sector.id)) {
          sectorMap.set(sector.id, { id: sector.id, name: sector.name });
        }
      });
    });

    sortedLog.forEach((entry, index) => {
      // Extract factory info from destination string (format: "CompanyName FACTORY I (Slot X)")
      // Note: The destination uses "FACTORY I" (with space), not "FACTORY_I" (with underscore)
      const match = entry.destination.match(/(.+?)\s+(FACTORY\s+[IVX]+)\s+\(Slot\s+\d+\)/);
      if (!match) {
        console.warn('Failed to parse destination:', entry.destination);
        return;
      }

      const companyName = match[1].trim();
      // Convert "FACTORY I" back to "FACTORY_I" for matching
      const factorySize = match[2].replace(/\s+/g, '_');
      
      // Find factory and company
      const company = companies.find(c => c.name === companyName);
      const factory = company?.factories.find(f => f.size === factorySize);
      
      if (!factory || !company) return;

      // Extract resource type from consumer profile
      // Format: "FACTORY_SIZE - [RESOURCE1, RESOURCE2, ...]"
      const resourceMatch = entry.consumerProfile.match(/\[([^\]]+)\]/);
      const resourceTypes = resourceMatch ? resourceMatch[1].split(',').map(r => r.trim()) : [];
      const resourceType = resourceTypes[0] || 'UNKNOWN'; // Use first resource type for matching

      // Find sector for this company
      const sectorId = sectors.find(s => s.name === company.sector)?.id || '';
      const sectorName = company.sector;

      // Get current factory state
      const factoryState = factoryStates.get(factory.id)!;
      const newCurrent = factoryState.current + 1;

      // Find consumption marker for this resource (simulate drawing)
      // Count how many markers have been drawn for this sector so far
      const markersDrawnCount = steps.filter(s => s.sectorId === sectorId && s.markerDrawn).length;
      
      // Find available markers in this sector that match the resource type
      const sectorMarkers = consumptionBags.filter(m => m.sectorId === sectorId);
      
      // Try to find a matching marker (that hasn't been drawn yet)
      const matchingMarkers = sectorMarkers.filter(m => 
        m.resourceType === resourceType || resourceTypes.includes(m.resourceType)
      );
      
      // Use matching marker if available, otherwise any remaining marker
      const markerToDraw = (matchingMarkers.length > markersDrawnCount 
        ? matchingMarkers[markersDrawnCount] 
        : sectorMarkers[markersDrawnCount]) || null;

      steps.push({
        step: stepIndex++,
        sectorId,
        sectorName,
        markerDrawn: markerToDraw ? {
          resourceType: markerToDraw.resourceType,
          isPermanent: markerToDraw.isPermanent,
        } : null,
        customerAssigned: {
          factoryId: factory.id,
          companyName,
          factorySize,
          reason: entry.reason,
        },
        factoryStates: new Map(factoryStates), // Clone current state
      });

      // Update factory state for next iteration
      factoryState.current = newCurrent;
    });

    return steps;
  }, [flowLog, companies, consumptionBags, sectors]);

  const totalSteps = animationSteps.length;
  const currentStepData = animationSteps[currentStep];

  // If no animation steps, show message
  if (totalSteps === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <p className="text-gray-400 text-lg mb-2">No animation data available</p>
          <p className="text-gray-500 text-sm">
            {flowLog.length === 0 
              ? "The consumption phase hasn't resolved yet, or no customers were served this turn."
              : "Unable to generate animation steps from flow log data."}
          </p>
        </div>
      </div>
    );
  }

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying || currentStep >= totalSteps - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
    }, animationSpeed);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, totalSteps, animationSpeed]);

  const handlePlay = () => {
    if (currentStep >= totalSteps - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  // Get current factory states
  const getCurrentFactoryState = (factoryId: string) => {
    if (!currentStepData) return { current: 0, max: 0 };
    return currentStepData.factoryStates.get(factoryId) || { current: 0, max: 0 };
  };

  // Get remaining markers in bag (returns actual marker objects, not just count)
  const getRemainingMarkers = (sectorId: string) => {
    const sectorMarkers = consumptionBags.filter(m => m.sectorId === sectorId);
    
    if (!currentStepData) return sectorMarkers;
    
    // Track which markers have been drawn so far
    const drawnMarkers = animationSteps
      .slice(0, currentStep + 1)
      .filter(s => s.sectorId === sectorId && s.markerDrawn)
      .map(s => s.markerDrawn!);
    
    // Return markers that haven't been drawn yet
    // We match by resource type and permanence status
    const remaining = sectorMarkers.filter(marker => {
      const wasDrawn = drawnMarkers.some(drawn => 
        drawn.resourceType === marker.resourceType && 
        drawn.isPermanent === marker.isPermanent
      );
      return !wasDrawn;
    });
    
    return remaining;
  };

  // Get drawn markers for a sector (what's been drawn so far in the animation)
  const getDrawnMarkers = (sectorId: string) => {
    if (!currentStepData) return [];
    
    return animationSteps
      .slice(0, currentStep + 1)
      .filter(s => s.sectorId === sectorId && s.markerDrawn)
      .map(s => s.markerDrawn!);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              color={isPlaying ? 'default' : 'primary'}
              onClick={isPlaying ? handlePause : handlePlay}
              startContent={isPlaying ? <RiPauseFill size={16} /> : <RiPlayFill size={16} />}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button
              size="sm"
              variant="bordered"
              onClick={handleStep}
              isDisabled={isPlaying || currentStep >= totalSteps - 1}
              startContent={<RiSkipForwardFill size={16} />}
            >
              Step
            </Button>
            <Button
              size="sm"
              variant="bordered"
              onClick={handleReset}
              startContent={<RiRestartLine size={16} />}
            >
              Reset
            </Button>
          </div>
          <div className="text-sm text-gray-400">
            Step {currentStep + 1} of {totalSteps}
          </div>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Animation Display */}
      {currentStepData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Consumption Bags */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Consumption Bags</h3>
            <div className="space-y-3">
              {sectors.map(sector => {
                const remainingMarkers = getRemainingMarkers(sector.id);
                const drawnMarkers = getDrawnMarkers(sector.id);
                const sectorMarkers = consumptionBags.filter(m => m.sectorId === sector.id);
                
                const isActive = currentStepData.sectorId === sector.id;
                const currentDrawnMarker = currentStepData.markerDrawn;

                return (
                  <motion.div
                    key={sector.id}
                    className={`bg-gray-700 rounded-lg p-3 border-2 ${
                      isActive ? 'border-blue-500' : 'border-gray-600'
                    }`}
                    animate={isActive ? { scale: 1.02 } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-200">{sector.name}</span>
                      <span className="text-sm text-gray-400">
                        {remainingMarkers.length} in bag, {drawnMarkers.length} drawn
                      </span>
                    </div>
                    
                    {/* What's in the bag */}
                    <div className="mb-3">
                      <div className="text-xs text-gray-400 mb-1.5 font-medium">In Bag:</div>
                      <div className="flex flex-wrap gap-2">
                        {remainingMarkers.length > 0 ? (
                          remainingMarkers.slice(0, 20).map((marker, i) => (
                            <motion.div
                              key={marker.id || `remaining-${i}`}
                              animate={i === 0 && isActive && currentDrawnMarker && currentDrawnMarker.resourceType === marker.resourceType ? {
                                opacity: [1, 0, 0],
                                scale: [1, 1.5, 0],
                                y: [-10, -30, -50],
                              } : {}}
                              transition={{ duration: 0.5 }}
                            >
                              <ResourceIcon 
                                resourceType={marker.resourceType} 
                                size="w-5 h-5"
                                title={marker.isPermanent ? `${marker.resourceType} (Permanent)` : `${marker.resourceType} (Temporary)`}
                              />
                            </motion.div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500 italic">Empty</span>
                        )}
                        {remainingMarkers.length > 20 && (
                          <div className="text-xs text-gray-500 flex items-center">
                            +{remainingMarkers.length - 20} more
                          </div>
                        )}
                      </div>
                    </div>

                    {/* What's been drawn */}
                    {drawnMarkers.length > 0 && (
                      <div className="pt-2 border-t border-gray-600">
                        <div className="text-xs text-gray-400 mb-1.5 font-medium">Drawn:</div>
                        <div className="flex flex-wrap gap-2">
                          {drawnMarkers.map((drawn, i) => (
                            <motion.div
                              key={`drawn-${i}`}
                              initial={i === drawnMarkers.length - 1 && isActive ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded border border-blue-500/50"
                            >
                              <ResourceIcon resourceType={drawn.resourceType} size="w-4 h-4" />
                              <span className="text-xs text-blue-300">
                                {drawn.isPermanent ? 'P' : 'T'}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Current draw animation (if active) */}
                    <AnimatePresence>
                      {isActive && currentDrawnMarker && (
                        <motion.div
                          initial={{ opacity: 0, y: -20, scale: 0 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          className="flex items-center gap-2 mt-2 p-2 bg-blue-500/30 rounded border-2 border-blue-500"
                        >
                          <ResourceIcon resourceType={currentDrawnMarker.resourceType} size="w-5 h-5" />
                          <span className="text-sm text-blue-200 font-medium">
                            Drawing: {currentDrawnMarker.resourceType}
                            {currentDrawnMarker.isPermanent ? ' (Permanent)' : ' (Temporary)'}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Factory Assignments */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Factory Assignments</h3>
            <div className="space-y-4">
              {currentStepData.customerAssigned && (() => {
                const assignedCompany = companies.find(c => 
                  c.name === currentStepData.customerAssigned.companyName
                );
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-blue-500/20 rounded-lg p-3 border border-blue-500"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <RiTeamFill className="text-blue-400" size={20} />
                      <span className="font-medium text-blue-300">Customer Assigned</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="text-gray-400">To: </span>
                        <span className="text-white font-semibold">
                          {currentStepData.customerAssigned.companyName}
                        </span>
                        {assignedCompany && (
                          <>
                            <span className="text-gray-500 mx-1">•</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-600/50 text-gray-300 border border-gray-500/50">
                              {assignedCompany.sector}
                            </span>
                          </>
                        )}
                        <span className="text-gray-400"> - </span>
                        <span className="text-gray-300">
                          {currentStepData.customerAssigned.factorySize.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Reason: </span>
                        <span className="text-yellow-300">
                          {currentStepData.customerAssigned.reason}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}

              {/* Company Factories */}
              {companies.map(company => (
                <div key={company.id} className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-white">{company.name}</h4>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-600 text-gray-300 border border-gray-500">
                        {company.sector}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Brand Score: {company.brandScore}</p>
                  </div>
                  
                  <div className="space-y-2">
                    {company.factories.map(factory => {
                      const state = getCurrentFactoryState(factory.id);
                      const percentage = state.max > 0 ? (state.current / state.max) * 100 : 0;
                      
                      return (
                        <motion.div
                          key={factory.id}
                          className="bg-gray-600 rounded p-2"
                          animate={
                            currentStepData.customerAssigned?.factoryId === factory.id
                              ? { scale: [1, 1.05, 1] }
                              : {}
                          }
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-300">
                              {factory.size.replace('_', ' ')}
                            </span>
                            <span className="text-xs font-semibold text-green-400">
                              {state.current}/{state.max}
                            </span>
                          </div>
                          
                          {/* Resources */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {factory.resources.map((resource, idx) => (
                              <ResourceIcon key={idx} resourceType={resource} size="w-3 h-3" />
                            ))}
                          </div>
                          
                          {/* Capacity bar */}
                          <div className="w-full bg-gray-500 rounded-full h-2">
                            <motion.div
                              className="bg-green-500 h-2 rounded-full"
                              initial={false}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step Summary */}
      {currentStepData && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Step Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Sector</div>
              <div className="text-white font-semibold">{currentStepData.sectorName}</div>
            </div>
            <div>
              <div className="text-gray-400">Marker Drawn</div>
              <div className="text-white font-semibold">
                {currentStepData.markerDrawn?.resourceType || 'None'}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Customer Assigned</div>
              <div className="text-white font-semibold">
                {currentStepData.customerAssigned?.companyName || 'None'}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Total Served</div>
              <div className="text-green-400 font-semibold">
                {Array.from(currentStepData.factoryStates.values())
                  .reduce((sum, state) => sum + state.current, 0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

