import { PhaseName } from "@server/prisma/prisma.client";

/**
 * Color scheme for different phase types
 * Stock phases: Yellow/Orange
 * Operating phases: Blue/Cyan
 * Resolution phases: Purple
 * Setup phases: Green
 * End phases: Red
 */
export function getPhaseColor(phaseName: PhaseName | undefined): {
  bg: string;
  border: string;
  text: string;
  gradient: string;
} {
  if (!phaseName) {
    return {
      bg: "bg-gray-500",
      border: "border-gray-500",
      text: "text-gray-500",
      gradient: "from-gray-500 to-gray-600",
    };
  }

  // Stock Round Phases - Yellow/Orange
  if (
    phaseName.startsWith("STOCK_") ||
    phaseName === PhaseName.STOCK_MEET ||
    phaseName === PhaseName.STOCK_RESULTS_OVERVIEW
  ) {
    return {
      bg: "bg-yellow-500",
      border: "border-yellow-500",
      text: "text-yellow-500",
      gradient: "from-yellow-500 to-orange-500",
    };
  }

  // Operating Round Phases - Blue/Cyan
  if (
    phaseName.startsWith("OPERATING_") ||
    phaseName.startsWith("FACTORY_") ||
    phaseName.startsWith("CONSUMPTION_") ||
    phaseName.startsWith("MARKETING_") ||
    phaseName === PhaseName.EARNINGS_CALL ||
    phaseName === PhaseName.OPERATING_MEET
  ) {
    return {
      bg: "bg-blue-500",
      border: "border-blue-500",
      text: "text-blue-500",
      gradient: "from-blue-500 to-cyan-500",
    };
  }

  // Resolution Phases - Purple
  if (
    phaseName.includes("RESOLVE") ||
    phaseName.includes("RESULT") ||
    phaseName === PhaseName.OPERATING_ACTION_COMPANY_VOTE_RESULT
  ) {
    return {
      bg: "bg-purple-500",
      border: "border-purple-500",
      text: "text-purple-500",
      gradient: "from-purple-500 to-pink-500",
    };
  }

  // Setup/Initialization Phases - Green
  if (
    phaseName === PhaseName.START_TURN ||
    phaseName === PhaseName.SET_COMPANY_IPO_PRICES ||
    phaseName === PhaseName.RESOLVE_SET_COMPANY_IPO_PRICES ||
    phaseName === PhaseName.HEADLINE_RESOLVE ||
    phaseName.startsWith("PRIZE_")
  ) {
    return {
      bg: "bg-green-500",
      border: "border-green-500",
      text: "text-green-500",
      gradient: "from-green-500 to-emerald-500",
    };
  }

  // End Turn Phases - Red
  if (phaseName === PhaseName.END_TURN) {
    return {
      bg: "bg-red-500",
      border: "border-red-500",
      text: "text-red-500",
      gradient: "from-red-500 to-rose-500",
    };
  }

  // Influence Phases - Teal
  if (phaseName.startsWith("INFLUENCE_")) {
    return {
      bg: "bg-teal-500",
      border: "border-teal-500",
      text: "text-teal-500",
      gradient: "from-teal-500 to-cyan-500",
    };
  }

  // Default - Gray
  return {
    bg: "bg-gray-500",
    border: "border-gray-500",
    text: "text-gray-500",
    gradient: "from-gray-500 to-gray-600",
  };
}

