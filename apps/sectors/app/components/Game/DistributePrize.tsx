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

const DistributePrize = ({ prize }: { prize: PrizeWithSectorPrizes }) => {
  const { gameId } = useGame();
  const { data: companiesWithSector, isLoading } =
    trpc.company.listCompaniesWithSector.useQuery({
      where: { gameId },
    });

  const [selectedCompanies, setSelectedCompanies] = useState<
    Record<string, string>
  >({});
  const [distributionData, setDistributionData] = useState<any[]>([]);

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!companiesWithSector) {
    return null;
  }
  const companiesBySector = organizeCompaniesBySector(companiesWithSector);

  const handleSelectChange = (sectorId: string, companyId: string) => {
    setSelectedCompanies((prev) => ({
      ...prev,
      [sectorId]: companyId,
    }));
  };

  const handleAddCashDistribution = (playerId: string, amount: number) => {
    setDistributionData((prev) => [
      ...prev,
      {
        prizetype: "cash",
        playerId,
        amount,
      },
    ]);
  };

  const handleAddPrestigeDistribution = (companyId: string, amount: number) => {
    setDistributionData((prev) => [
      ...prev,
      {
        prizetype: "prestige",
        companyId,
        amount,
      },
    ]);
  };

  const handleAddPassiveEffectDistribution = (
    companyId: string,
    sectorId: string
  ) => {
    const effectName = SectorEffects[sectorId].passive;
    setDistributionData((prev) => [
      ...prev,
      {
        prizetype: "passive",
        companyId,
        effectName,
      },
    ]);
  };

  return (
    <div>
      <div>
        {prize.cashAmount && (
          <div>
            <div>${prize.cashAmount}</div>
            <PlayerSelect
              onChange={(event) => {
                const cashAmount = Number(
                  prompt(`Enter cash amount (max ${prize.cashAmount}):`)
                );
                if (cashAmount > 0 && cashAmount <= (prize.cashAmount || 0)) {
                  handleAddCashDistribution(event.target.value, cashAmount);
                }
              }}
            />
            <DebounceButton onClick={() => console.log(distributionData)}>
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
              onChange={(event) => {
                const companyId = event.target.value;
                const prestigeAmount = Number(
                  prompt(`Enter prestige amount (max ${prize.prestigeAmount}):`)
                );
                if (
                  prestigeAmount > 0 &&
                  prestigeAmount <= (prize.prestigeAmount || 0)
                ) {
                  handleAddPrestigeDistribution(companyId, prestigeAmount);
                }
              }}
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
            <DebounceButton onClick={() => console.log(distributionData)}>
              Add To Distribution
            </DebounceButton>
          </div>
        )}
      </div>
      <div>
        {prize.SectorPrizes &&
          prize.SectorPrizes.map((sectorPrize) => (
            <div key={sectorPrize.sectorId}>
              <span>{sectorPrize.Sector.name}</span>
              <span>
                {SectorEffects[sectorPrize.Sector.sectorName].passive}
              </span>
              <Select
                label="Company Topic"
                placeholder="Select a company"
                className="max-w-xs"
                onChange={(event) =>
                  handleAddPassiveEffectDistribution(
                    event.target.value,
                    sectorPrize.Sector.sectorName
                  )
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
            </div>
          ))}
      </div>
    </div>
  );
};

const DistributePrizes = () => {
  const { currentTurn, authPlayer } = useGame();
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
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error...</div>;
  }
  if (!prizes) {
    return null;
  }
  return (
    <div>
      <h1>Distribute Prize</h1>
      {prizes.map((prize) => (
        <div key={prize.id}>
          <DistributePrize prize={prize} />
        </div>
      ))}
    </div>
  );
};
export default DistributePrizes;
