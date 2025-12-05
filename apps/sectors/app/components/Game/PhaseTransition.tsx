"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhaseName } from "@server/prisma/prisma.client";
import { friendlyPhaseName } from "@sectors/app/helpers";
import { getPhaseColor } from "@sectors/app/helpers/phaseColors";
import { RiArrowRightFill, RiCheckFill } from "@remixicon/react";

interface PhaseTransitionProps {
  previousPhase?: PhaseName;
  currentPhase: PhaseName;
  onComplete?: () => void;
}

export function PhaseTransition({
  previousPhase,
  currentPhase,
  onComplete,
}: PhaseTransitionProps) {
  const [showTransition, setShowTransition] = useState(true);
  const [showSummary, setShowSummary] = useState(true);

  useEffect(() => {
    // Show transition for 0.8 seconds, then summary for 1.2 seconds (total 2 seconds)
    const timer1 = setTimeout(() => {
      setShowTransition(false);
    }, 1200);

    const timer2 = setTimeout(() => {
      setShowSummary(false);
      onComplete?.();
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  const currentColors = getPhaseColor(currentPhase);
  const previousColors = previousPhase ? getPhaseColor(previousPhase) : null;

  return (
    <AnimatePresence>
      {showTransition && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="text-center"
          >
            {previousPhase && (
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={`mb-4 px-6 py-3 rounded-lg ${previousColors?.bg} text-white`}
              >
                {friendlyPhaseName(previousPhase)}
              </motion.div>
            )}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mb-4"
            >
              <RiArrowRightFill size={48} className="text-white mx-auto" />
            </motion.div>
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className={`px-8 py-4 rounded-lg bg-gradient-to-r ${currentColors.gradient} text-white text-2xl font-bold shadow-2xl`}
            >
              {friendlyPhaseName(currentPhase)}
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {!showTransition && showSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 max-w-md"
        >
          <div className={`bg-gradient-to-r ${currentColors.gradient} text-white p-4 rounded-lg shadow-2xl`}>
            <div className="flex items-center gap-2 mb-2">
              <RiCheckFill size={20} />
              <h3 className="font-bold text-lg">Phase Transition Complete</h3>
            </div>
            <p className="text-sm opacity-90">
              Now entering: <strong>{friendlyPhaseName(currentPhase)}</strong>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

