import { ExecutivePhaseName } from "@server/prisma/prisma.client";
export function friendlyPhaseName(phaseName: ExecutivePhaseName | undefined): {
  name: string;
  description: string;
} {
  if (phaseName == undefined) {
    return {
      name: "Unknown Phase",
      description: "The current phase is unknown or not specified.",
    };
  }

  switch (phaseName) {
    case ExecutivePhaseName.START_GAME:
      return {
        name: "Start Game",
        description: "The game begins, and players prepare for the first turn.",
      };
    case ExecutivePhaseName.START_TURN:
      return {
        name: "Start Turn",
        description: "The start of a new turn for all players.",
      };
    case ExecutivePhaseName.END_TURN:
      return {
        name: "End Turn",
        description:
          "The end of the current turn. Players finalize their actions.",
      };
    case ExecutivePhaseName.GAME_END:
      return {
        name: "End Game",
        description: "The game has ended. The final scores are tallied.",
      };
    case ExecutivePhaseName.DEAL_CARDS:
      return {
        name: "Deal Cards",
        description: "Cards are dealt to players for the upcoming phase.",
      };
    case ExecutivePhaseName.INFLUENCE_BID:
      return {
        name: "Influence Bid",
        description: "Select any other players bribe and place a bid from your influence pool.  Only a single bid can be placed on a bribe per turn.",
      };
    case ExecutivePhaseName.INFLUENCE_BID_SELECTION:
      return {
        name: "Influence Bid Selection",
        description: "Players select their bids for influence.",
      };
    case ExecutivePhaseName.MOVE_COO_AND_GENERAL_COUNSEL:
      return {
        name: "Move COO and General Counsel",
        description:
          "COO and General Counsel are moved to strategic positions.",
      };
    case ExecutivePhaseName.RESOLVE_AGENDA:
      return {
        name: "Resolve Agenda",
        description: "Players resolve the current agenda and its effects.",
      };
    case ExecutivePhaseName.RESOLVE_LEADERSHIP:
      return {
        name: "Resolve Leadership",
        description: "Leadership decisions are resolved.",
      };
    case ExecutivePhaseName.RESOLVE_TRICK:
      return {
        name: "Resolve Trick",
        description: "The current trick is resolved, determining the winner.",
      };
    case ExecutivePhaseName.REVEAL_TRUMP:
      return {
        name: "Reveal Trump",
        description: "The trump card is revealed, affecting the current trick.",
      };
    case ExecutivePhaseName.RESOLVE_VOTE:
      return {
        name: "Resolve Vote",
        description: "The results of the vote are resolved and implemented.",
      };
    case ExecutivePhaseName.REVEAL_TRICK:
      return {
        name: "Reveal Trick",
        description: "Players reveal their cards for the current trick.",
      };
    case ExecutivePhaseName.VOTE:
      return {
        name: "Vote",
        description:
          "Players cast their votes on the current agenda or action.",
      };
    default:
      return {
        name: "Unknown Phase",
        description: "The current phase is not recognized.",
      };
  }
}