import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { PrizeWithSectorPrizes } from "@server/prisma/prisma.types";
import { RiSparkling2Fill } from "@remixicon/react";
import { SectorEffects } from "@server/data/constants";
import {
  Button,
  Input,
  Select,
  SelectItem,
  SelectSection,
} from "@nextui-org/react";
import DebounceButton from "../General/DebounceButton";
import PlayerSelect from "./PlayerSelect";
import { organizeCompaniesBySector } from "@sectors/app/helpers";
import { useState } from "react";
import { OperatingRoundAction } from "@server/prisma/prisma.client";

type DistributionData =
  | {
      prizetype: "cash";
      playerId: string;
      amount: number;
    }
  | {
      prizetype: "prestige";
      companyId: string;
      amount: number;
    }
  | {
      prizetype: "passive";
      companyId: string;
      effectName: OperatingRoundAction;
    };

const DistributePrize = ({
  prize,
  setDistributionData,
  distributionData,
}: {
  prize: PrizeWithSectorPrizes;
  setDistributionData: React.Dispatch<React.SetStateAction<DistributionData[]>>;
  distributionData: DistributionData[];
}) => {
  const { gameId } = useGame();
  const { data: companiesWithSector, isLoading } =
    trpc.company.listCompaniesWithSector.useQuery({
      where: { gameId },
    });

  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [prestigeAmount, setPrestigeAmount] = useState<number>(0);
  const [selectedSectorCompany, setSelectedSectorCompany] = useState<
    Record<string, string>
  >({});

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!companiesWithSector) {
    return null;
  }
  const companiesBySector = organizeCompaniesBySector(companiesWithSector);

  const handleSelectChange = (sectorId: string, companyId: string) => {
    setSelectedSectorCompany((prev) => ({
      ...prev,
      [sectorId]: companyId,
    }));
  };

  const handleAddCashDistribution = () => {
    if (selectedPlayer && cashAmount > 0) {
      setDistributionData((prev) => [
        ...prev,
        {
          prizetype: "cash",
          playerId: selectedPlayer,
          amount: cashAmount,
        },
      ]);
      // Reset state after adding
      setSelectedPlayer("");
      setCashAmount(0);
    }
  };

  const handleAddPrestigeDistribution = () => {
    if (selectedCompany && prestigeAmount > 0) {
      setDistributionData((prev) => [
        ...prev,
        {
          prizetype: "prestige",
          companyId: selectedCompany,
          amount: prestigeAmount,
        },
      ]);
      // Reset state after adding
      setSelectedCompany("");
      setPrestigeAmount(0);
    }
  };

  const handleAddPassiveEffectDistribution = (sectorId: string) => {
    const companyId = selectedSectorCompany[sectorId];
    if (companyId) {
      const effectName = SectorEffects[sectorId].passive;
      setDistributionData((prev) => [
        ...prev,
        {
          prizetype: "passive",
          companyId,
          effectName,
        },
      ]);
      // Reset state after adding
      setSelectedSectorCompany((prev) => ({
        ...prev,
        [sectorId]: "",
      }));
    }
  };

  return (
    <div>
      {prize.cashAmount && (
        <div>
          <div>${prize.cashAmount}</div>
          <PlayerSelect
            onChange={(event) => setSelectedPlayer(event.target.value)}
          />
          <Input
            type="number"
            placeholder="Amount"
            value={cashAmount.toString()}
            onChange={(event) => setCashAmount(Number(event.target.value))}
            min={0}
            max={prize.cashAmount}
          />
          <DebounceButton onClick={handleAddCashDistribution}>
            Add To Distribution
          </DebounceButton>
        </div>
      )}
      {prize.prestigeAmount && (
        <div>
          <div>
            <RiSparkling2Fill /> {prize.prestigeAmount}
          </div>
          <Select
            label="Company Topic"
            placeholder="Select a company"
            className="max-w-xs"
            onChange={(event) => setSelectedCompany(event.target.value)}
          >
            {Object.entries(companiesBySector).map(
              ([sectorId, { sector, companies }]) => (
                <SelectSection key={sectorId} title={sector.name}>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectSection>
              )
            )}
          </Select>
          <Input
            type="number"
            placeholder="Amount"
            value={prestigeAmount.toString()}
            onChange={(event) => setPrestigeAmount(Number(event.target.value))}
            min={0}
            max={prize.prestigeAmount}
          />
          <DebounceButton onClick={handleAddPrestigeDistribution}>
            Add To Distribution
          </DebounceButton>
        </div>
      )}
      {prize.SectorPrizes &&
        prize.SectorPrizes.map((sectorPrize) => (
          <div key={sectorPrize.sectorId}>
            <span>{sectorPrize.Sector.name}</span>
            <span>{SectorEffects[sectorPrize.Sector.sectorName].passive}</span>
            <Select
              label="Company Topic"
              placeholder="Select a company"
              className="max-w-xs"
              onChange={(event) =>
                handleSelectChange(sectorPrize.sectorId, event.target.value)
              }
            >
              {companiesBySector[sectorPrize.sectorId]?.companies.map(
                (company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                )
              )}
            </Select>
            <DebounceButton
              onClick={() =>
                handleAddPassiveEffectDistribution(
                  sectorPrize.Sector.sectorName
                )
              }
            >
              Add To Distribution
            </DebounceButton>
          </div>
        ))}
    </div>
  );
};
const DistributePrizes = () => {
  const { currentTurn, authPlayer } = useGame();
  const [distributionData, setDistributionData] = useState<DistributionData[]>(
    []
  );

  const {
    data: prizes,
    isLoading,
    isError,
  } = trpc.prizes.listPrizes.useQuery({
    where: {
      gameTurnId: currentTurn.id,
      playerId: authPlayer.id,
    },
  });
  const usePrizeDistributionMutation =
    trpc.game.prizeDistribution.useMutation();

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error...</div>;
  }
  if (!prizes) {
    return null;
  }

  const handleFinalizeDistribution = () => {
    console.log("Final Distribution Data:", distributionData);
    usePrizeDistributionMutation.mutate({
      playerId: authPlayer.id,
      distributionData,
    });
  };

  return (
    <div>
      <h1>Distribute Prizes</h1>
      {prizes.map((prize) => (
        <div key={prize.id}>
          <DistributePrize
            prize={prize}
            setDistributionData={setDistributionData}
            distributionData={distributionData}
          />
        </div>
      ))}
      <button onClick={handleFinalizeDistribution}>
        Finalize Distribution
      </button>
    </div>
  );
};

export default DistributePrizes;
