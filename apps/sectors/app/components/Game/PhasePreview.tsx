"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhaseName } from "@server/prisma/prisma.client";
import { friendlyPhaseName } from "@sectors/app/helpers";
import { getPhaseColor } from "@sectors/app/helpers/phaseColors";
import { RiInformationFill, RiTimeFill } from "@remixicon/react";
import { Card, CardBody } from "@nextui-org/react";

interface PhasePreviewProps {
  currentPhase?: PhaseName;
  nextPhase?: PhaseName;
  timeRemaining?: number; // in seconds
  onDismiss?: () => void;
}

export function PhasePreview({
  currentPhase,
  nextPhase,
  timeRemaining,
  onDismiss,
}: PhasePreviewProps) {
  const [show, setShow] = useState(true);
  const [countdown, setCountdown] = useState(timeRemaining || 0);

  useEffect(() => {
    if (timeRemaining && timeRemaining > 0) {
      setCountdown(timeRemaining);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timeRemaining]);

  if (!nextPhase) return null;

  const nextColors = getPhaseColor(nextPhase);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          className="fixed top-20 right-4 z-40 max-w-sm"
        >
          <Card className={`bg-gradient-to-br ${nextColors.gradient} text-white border-2 ${nextColors.border}`}>
            <CardBody className="p-4">
              <div className="flex items-start gap-3">
                <RiInformationFill size={24} className="flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">What&apos;s Next</h3>
                  <p className="text-sm mb-2 opacity-90">
                    Upcoming phase: <strong>{friendlyPhaseName(nextPhase)}</strong>
                  </p>
                  {countdown > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <RiTimeFill size={16} />
                      <span>Phase will advance in {countdown}s</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShow(false);
                    onDismiss?.();
                  }}
                  className="text-white/80 hover:text-white transition-colors"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

