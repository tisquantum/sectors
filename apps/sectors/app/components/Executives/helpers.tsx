import { Agenda, ExecutivePhaseName } from "@server/prisma/prisma.client";
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
        description:
          "Select any other players bribe and place a bid from your influence pool.  Only a single bid can be placed on a bribe per turn.",
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
    case ExecutivePhaseName.START_TRICK:
      return {
        name: "Start Trick",
        description: "The start of a new trick for all players.",
      };
    case ExecutivePhaseName.SELECT_TRICK:
      return {
        name: "Select Trick",
        description: "Players select a card to play for the current trick.",
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
    case ExecutivePhaseName.START_VOTE:
      return {
        name: "Start Vote",
        description: "Players prepare to vote on the current agenda or action.",
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
          "Select influence to use to create a vote concensus.  The player or ceo with the most influence will win the vote.",
      };
    default:
      return {
        name: "Unknown Phase",
        description: "The current phase is not recognized.",
      };
  }
}

export function turnPhaseDisplayTrump(phaseName: ExecutivePhaseName): boolean {
  switch (phaseName) {
    case ExecutivePhaseName.START_TRICK:
    case ExecutivePhaseName.SELECT_TRICK:
    case ExecutivePhaseName.RESOLVE_TRICK:
    case ExecutivePhaseName.REVEAL_TRUMP:
    case ExecutivePhaseName.REVEAL_TRICK:
    case ExecutivePhaseName.END_TURN:
      return true;
    default:
      return false;
  }
}

export function friendlyAgendaName(agendaType: Agenda): string {
  switch (agendaType) {
    case Agenda.BECOME_CEO_NO_SHARE:
      return "Become CEO - No Share";
    case Agenda.BECOME_CEO_WITH_FOREIGN_INVESTOR:
      return "Become CEO - With Foreign Investor";
    case Agenda.CEO_THREE_PLAYERS:
      return "Three CEOs";
    case Agenda.FIRST_LEFT_CEO:
      return "Player Left CEO";
    case Agenda.FOREIGN_INVESTOR_CEO:
      return "Foreign Investor CEO";
    case Agenda.SECOND_LEFT_CEO:
      return "Second Left CEO";
    case Agenda.THIRD_LEFT_CEO:
      return "Third Left CEO";
    default:
      return "Unknown Agenda";
  }
}
