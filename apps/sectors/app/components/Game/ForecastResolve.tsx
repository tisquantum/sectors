"use client";

import React, { useEffect, useState } from "react";
import { useGame } from "./GameContext";
import { trpc } from "@sectors/app/trpc";
import { Card, CardBody, Spinner } from "@nextui-org/react";
import { RiCheckboxCircleFill, RiLoader4Line, RiCheckboxBlankCircleLine } from "@remixicon/react";

type StepStatus = "pending" | "in_progress" | "completed";

interface Step {
  id: string;
  label: string;
  status: StepStatus;
  details?: string;
}

const ForecastResolve = () => {
  const { gameId, gameState } = useGame();
  const [steps, setSteps] = useState<Step[]>([
    { id: "brand-bonus", label: "Adding brand bonus to Q1", status: "pending" },
    { id: "sector-abilities", label: "Applying sector abilities", status: "pending" },
    { id: "calculate-counters", label: "Calculating demand counters", status: "pending" },
    { id: "shift-quarters", label: "Shifting quarters left", status: "pending" },
  ]);

  // Poll game logs to detect progress
  const { data: gameLogs, refetch } = trpc.gameLog.listGameLogs.useQuery(
    {
      where: {
        gameId: gameId || "",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20, // Get last 20 logs
    },
    {
      enabled: !!gameId,
      refetchInterval: 1000, // Poll every second
    }
  );

  // Detect step completion from game logs
  useEffect(() => {
    if (!gameLogs || gameLogs.length === 0) return;

    setSteps(prevSteps => {
      const newSteps = [...prevSteps];
      const logs = gameLogs.map(log => ({ content: log.content.toLowerCase(), original: log.content }));
      
      // Check for brand bonus (step 1)
      const brandBonusLog = logs.find(log => 
        log.content.includes("brand bonus") || 
        (log.content.includes("added") && log.content.includes("q1"))
      );
      if (brandBonusLog) {
        const step = newSteps.find(s => s.id === "brand-bonus");
        if (step && step.status !== "completed") {
          step.status = "completed";
          step.details = brandBonusLog.original;
        }
      }

      // Check for sector abilities (step 2) - look for any sector ability log
      const sectorAbilityLogs = logs.filter(log => 
        log.content.includes("sector ability") ||
        log.content.includes("industrials") && log.content.includes("q2") ||
        log.content.includes("technology") && log.content.includes("q1") ||
        log.content.includes("energy") && (log.content.includes("q1") || log.content.includes("q3"))
      );
      if (sectorAbilityLogs.length > 0) {
        const step = newSteps.find(s => s.id === "sector-abilities");
        if (step && step.status !== "completed") {
          step.status = "completed";
          step.details = sectorAbilityLogs.map(l => l.original).join("; ");
        }
      }

      // Check for demand counters calculation (step 3)
      const demandCountersLog = logs.find(log => 
        log.content.includes("calculated demand counters") ||
        log.content.includes("demand counters")
      );
      if (demandCountersLog) {
        const step = newSteps.find(s => s.id === "calculate-counters");
        if (step && step.status !== "completed") {
          step.status = "completed";
          step.details = demandCountersLog.original;
        }
      }

      // Check for quarter shift (step 4)
      const shiftLog = logs.find(log => 
        log.content.includes("shifted quarters") ||
        (log.content.includes("quarter") && log.content.includes("shift")) ||
        log.content.includes("q1→active") ||
        log.content.includes("q2→q1")
      );
      if (shiftLog) {
        const step = newSteps.find(s => s.id === "shift-quarters");
        if (step && step.status !== "completed") {
          step.status = "completed";
          step.details = shiftLog.original;
        }
      }

      // Set in_progress for the first incomplete step
      const firstIncompleteIndex = newSteps.findIndex(s => s.status === "pending");
      if (firstIncompleteIndex !== -1 && firstIncompleteIndex < newSteps.length) {
        // Only set in_progress if we're actually in FORECAST_RESOLVE phase
        if (gameState?.currentPhaseId) {
          const currentPhase = gameState.Phase.find(p => p.id === gameState.currentPhaseId);
          if (currentPhase?.name === "FORECAST_RESOLVE") {
            newSteps[firstIncompleteIndex].status = "in_progress";
          }
        }
      }

      return newSteps;
    });
  }, [gameLogs, gameState]);

  // Check if we've moved past FORECAST_RESOLVE phase
  useEffect(() => {
    if (gameState?.currentPhaseId) {
      const currentPhase = gameState.Phase.find(p => p.id === gameState.currentPhaseId);
      if (currentPhase?.name !== "FORECAST_RESOLVE") {
        // All steps should be marked as completed if we've moved on
        setSteps(prevSteps => 
          prevSteps.map(step => ({ ...step, status: "completed" as StepStatus }))
        );
      }
    }
  }, [gameState?.currentPhaseId]);

  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case "completed":
        return <RiCheckboxCircleFill className="w-5 h-5 text-green-500" />;
      case "in_progress":
        return <RiLoader4Line className="w-5 h-5 text-blue-500 animate-spin" />;
      case "pending":
        return <RiCheckboxBlankCircleLine className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Resolving Forecast</h2>
        <p className="text-gray-400">Processing forecast resolution step by step...</p>
      </div>

      <Card className="w-full max-w-2xl bg-gray-800/50 border border-gray-700">
        <CardBody className="p-6">
          <div className="flex flex-col gap-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${
                  step.status === "in_progress"
                    ? "bg-blue-500/10 border border-blue-500/50"
                    : step.status === "completed"
                    ? "bg-green-500/10 border border-green-500/50"
                    : "bg-gray-700/30 border border-gray-600"
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getStepIcon(step.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-lg">{step.label}</span>
                    {step.status === "in_progress" && (
                      <Spinner size="sm" className="ml-2" />
                    )}
                  </div>
                  {step.details && (
                    <div className="text-sm text-gray-400 mt-1 italic">
                      {step.details}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="text-sm text-gray-500 text-center">
        {steps.every(s => s.status === "completed") 
          ? "Forecast resolution complete! Moving to next phase..."
          : "Processing... This may take a few moments."}
      </div>
    </div>
  );
};

export default ForecastResolve;
