import { PhaseName } from "@server/prisma/prisma.client";
import { useGame } from "./GameContext";
import { friendlyPhaseName } from "@sectors/app/helpers";

const phasesInOrder = [
    PhaseName.START_TURN,
    PhaseName.STOCK_MEET,
    PhaseName.STOCK_RESOLVE_LIMIT_ORDER,
    PhaseName.STOCK_ACTION_ORDER,
    PhaseName.STOCK_ACTION_RESULT,
    PhaseName.STOCK_ACTION_REVEAL,
    PhaseName.STOCK_RESOLVE_MARKET_ORDER,
    PhaseName.STOCK_SHORT_ORDER_INTEREST,
    PhaseName.STOCK_ACTION_SHORT_ORDER,
    PhaseName.STOCK_RESOLVE_PENDING_SHORT_ORDER,
    PhaseName.STOCK_RESOLVE_OPTION_ORDER,
    PhaseName.STOCK_OPEN_LIMIT_ORDERS,
    PhaseName.STOCK_RESULTS_OVERVIEW,
    PhaseName.OPERATING_MEET,
    PhaseName.OPERATING_PRODUCTION,
    PhaseName.OPERATING_PRODUCTION_VOTE,
    PhaseName.OPERATING_PRODUCTION_VOTE_RESOLVE,
    PhaseName.OPERATING_STOCK_PRICE_ADJUSTMENT,
    PhaseName.OPERATING_ACTION_COMPANY_VOTE,
    PhaseName.OPERATING_ACTION_COMPANY_VOTE_RESULT,
    PhaseName.OPERATING_COMPANY_VOTE_RESOLVE,
    PhaseName.CAPITAL_GAINS,
    PhaseName.DIVESTMENT,
    PhaseName.END_TURN,
  ];
  
const PhaseListComponent = () => {
    const {currentPhase} = useGame();

    return (
        <div className="flex flex-col gap-2">
            {phasesInOrder.map((phase) => (
                <div key={phase} className={`flex items-center bg-slate-900 p-1 border-3 ${phase === currentPhase?.name ? 'border-indigo-500/100' : 'border-slate-400'}`}>
                    <div>{friendlyPhaseName(phase) || phase}</div>
                </div>
            ))}
        </div>
    );
}

export default PhaseListComponent;