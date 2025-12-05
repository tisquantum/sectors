"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiCheckFill, RiSparklingFill } from "@remixicon/react";

interface SuccessAnimationProps {
  message: string;
  description?: string;
  onComplete?: () => void;
  duration?: number;
}

export function SuccessAnimation({
  message,
  description,
  onComplete,
  duration = 1500,
}: SuccessAnimationProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(() => onComplete?.(), 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-6 rounded-2xl shadow-2xl text-center min-w-[300px]"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mb-3"
            >
              <div className="relative inline-block">
                <RiCheckFill size={48} className="text-white" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-2 -right-2"
                >
                  <RiSparklingFill size={24} className="text-yellow-300" />
                </motion.div>
              </div>
            </motion.div>
            <motion.h3
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-bold mb-1"
            >
              {message}
            </motion.h3>
            {description && (
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm opacity-90"
              >
                {description}
              </motion.p>
            )}
            {/* Confetti effect */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((i * Math.PI * 2) / 12) * 100,
                  y: Math.sin((i * Math.PI * 2) / 12) * 100,
                  opacity: 0,
                }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-300 rounded-full"
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

