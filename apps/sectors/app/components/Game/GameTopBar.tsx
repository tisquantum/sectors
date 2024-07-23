import { ButtonGroup } from "@nextui-org/react";
import GameGeneralInfo from "./GameGeneralInfo";
import Timer from "./Timer";
import { useGame } from "./GameContext";
import { useState } from "react";
import { trpc, trpcClient } from "@sectors/app/trpc";
import {
  CompanyStatus,
  PhaseName,
  RoundType,
} from "@server/prisma/prisma.client";
import { determineNextGamePhase } from "@server/data/helpers";
import next from "next";
import { getNextCompanyOperatingRoundTurn } from "@server/data/constants";
import Button from "@sectors/app/components/General/DebounceButton";

const GameTopBar = ({
  gameId,
  handleCurrentView,
}: {
  gameId: string;
  handleCurrentView: (view: string) => void;
}) => {
  const [currentView, setCurrentView] = useState<string>("action");
  const useNextPhaseMutation = trpc.game.forceNextPhase.useMutation();
  const useRetryPhaseMutation = trpc.game.retryPhase.useMutation();
  const { currentPhase, gameState } = useGame();

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    handleCurrentView(view);
  };
  const getButtonClass = (view: string) =>
    currentView === view
      ? "bg-blue-500 text-white"
      : "bg-slate-700 text-stone-100";
  const checkNextPhase = async (
    nextPhaseName: PhaseName,
    currentPhase: any
  ) => {
    const doesNextPhaseNeedToBePlayed = await trpcClient.query(
      "game.doesNextPhaseNeedToBePlayed",
      {
        phaseName: nextPhaseName,
        currentPhase: currentPhase,
      }
    );

    return doesNextPhaseNeedToBePlayed;
  };

  const handleNextPhase = async () => {
    if (!currentPhase) return;

    let nextPhase;
    if (currentPhase.name === PhaseName.STOCK_RESULTS_OVERVIEW) {
      if (
        gameState.Company.every(
          (company) => company.status !== CompanyStatus.ACTIVE
        )
      ) {
        nextPhase = PhaseName.CAPITAL_GAINS;
      }
    }

    nextPhase = determineNextGamePhase(
      currentPhase?.name ?? PhaseName.START_TURN,
      {
        stockActionSubRound: gameState.StockRound.find(
          (stockRound) => stockRound.id === currentPhase?.stockRoundId
        )?.stockActionSubRound,
      }
    );

    let doesNextPhaseNeedToBePlayed = await checkNextPhase(
      nextPhase.phaseName,
      currentPhase
    );

    while (doesNextPhaseNeedToBePlayed === false) {
      nextPhase = determineNextGamePhase(nextPhase.phaseName, {
        stockActionSubRound: gameState.StockRound.find(
          (stockRound) => stockRound.id === currentPhase?.stockRoundId
        )?.stockActionSubRound,
      });
      doesNextPhaseNeedToBePlayed = await checkNextPhase(
        nextPhase.phaseName,
        currentPhase
      );
    }

    let companyId;
    if (nextPhase.phaseName === PhaseName.OPERATING_ACTION_COMPANY_VOTE) {
      const allCompaniesVoted = await trpcClient.query(
        "game.allCompanyActionsOperatingRoundResolved",
        {
          gameId,
        }
      );
      //check if all companies have voted
      if (allCompaniesVoted) {
        nextPhase.phaseName = PhaseName.CAPITAL_GAINS;
      } else {
        if (currentPhase?.companyId) {
          companyId = getNextCompanyOperatingRoundTurn(
            gameState.Company.filter(
              (company) => company.status == CompanyStatus.ACTIVE
            ),
            currentPhase?.companyId
          )?.id;
        } else {
          companyId = getNextCompanyOperatingRoundTurn(
            gameState.Company.filter(
              (company) => company.status == CompanyStatus.ACTIVE
            )
          ).id;
        }
      }
      if (!companyId) {
        nextPhase.phaseName = PhaseName.CAPITAL_GAINS;
      }
    } else {
      companyId = currentPhase?.companyId;
    }
    useNextPhaseMutation.mutate({
      gameId,
      phaseName: nextPhase.phaseName,
      roundType: nextPhase.roundType,
      stockRoundId: currentPhase?.stockRoundId ?? 0,
      operatingRoundId: currentPhase?.operatingRoundId ?? 0,
      influenceRoundId: currentPhase?.influenceRoundId ?? 0,
      companyId: companyId || undefined,
    });
  };
  const handleRetryPhase = () => {
    useRetryPhaseMutation.mutate({
      gameId,
    });
  };
  return (
    <div className="flex justify-between p-2">
      <ButtonGroup>
        <Button
          className={getButtonClass("action")}
          onClick={() => handleViewChange("action")}
        >
          Action
        </Button>
        <Button
          className={getButtonClass("pending")}
          onClick={() => handleViewChange("pending")}
        >
          Pending Orders
        </Button>
        <Button
          className={getButtonClass("chart")}
          onClick={() => handleViewChange("chart")}
        >
          Stock Chart
        </Button>
        <Button
          className={getButtonClass("economy")}
          onClick={() => handleViewChange("economy")}
        >
          Economy
        </Button>
      </ButtonGroup>
      <Button onClick={handleNextPhase}>Next Phase</Button>
      <Button onClick={handleRetryPhase}>Retry Phase</Button>
      {currentPhase && (
        <Timer
          countdownTime={currentPhase.phaseTime / 1000} //convert from seconds to milliseconds
          startDate={new Date(currentPhase.createdAt)} // attempt to cast to Date
          size={16}
          textSize={1}
          onEnd={() => {}}
        />
      )}
      <GameGeneralInfo />
    </div>
  );
};

export default GameTopBar;
