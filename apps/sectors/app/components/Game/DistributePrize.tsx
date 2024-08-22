import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import {
  PrizeDistributionWithRelations,
  PrizeWithRelations,
  PrizeWithSectorPrizes,
} from "@server/prisma/prisma.types";
import {
  RiCloseCircleFill,
  RiGameFill,
  RiSparkling2Fill,
} from "@remixicon/react";
import { SectorEffects } from "@server/data/constants";
import {
  Button,
  Input,
  Select,
  SelectItem,
  SelectSection,
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
  TableColumn,
  Tab,
} from "@nextui-org/react";
import DebounceButton from "../General/DebounceButton";
import PlayerSelect from "./PlayerSelect";
import { organizeCompaniesBySector } from "@sectors/app/helpers";
import { useEffect, useState } from "react";
import {
  CompanyStatus,
  OperatingRoundAction,
  PrizeDistributionType,
  SectorName,
} from "@server/prisma/prisma.client";
import PlayerAvatar from "../Player/PlayerAvatar";

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
      where: {
        gameId,
        OR: [
          { status: CompanyStatus.ACTIVE },
          { status: CompanyStatus.INSOLVENT },
        ],
      },
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

  const handleAddPassiveEffectDistribution = (
    sectorId: string,
    sectorName: SectorName
  ) => {
    const companyId = selectedSectorCompany[sectorId];
    if (companyId) {
      const effectName = SectorEffects[sectorName].passive;
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
    <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      {prize.cashAmount && (
        <div className="flex flex-col gap-1 p-2 rounded-md bg-slate-900">
          <div className="flex gap-1">
            <h3>Distribute Cash</h3>
            <div>${prize.cashAmount}</div>
          </div>
          {distributionData.reduce(
            (acc, curr) =>
              curr.prizetype === "cash" ? acc + curr.amount : acc,
            0
          ) >= (prize.cashAmount || 0) ? (
            <div>Cash fully distributed</div>
          ) : (
            <>
              <PlayerSelect
                onChange={(event) => setSelectedPlayer(event.target.value)}
                selectionMode="single"
              />
              {selectedPlayer && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {[25, 50, 75, 100, 125, 150, 175, 200].map((amount) => (
                      <DebounceButton
                        key={amount}
                        onClick={() => setCashAmount(amount)}
                        disabled={amount > (prize.cashAmount || 0)}
                        className={`${
                          cashAmount === amount ? "ring-2 ring-blue-500" : ""
                        }`}
                      >
                        ${amount}
                      </DebounceButton>
                    ))}
                    <DebounceButton
                      onClick={() => setCashAmount(prize.cashAmount || 0)}
                      className={`${
                        cashAmount === prize.cashAmount
                          ? "ring-2 ring-blue-500"
                          : ""
                      }`}
                    >
                      ALL
                    </DebounceButton>
                  </div>
                  <DebounceButton onClick={handleAddCashDistribution}>
                    Add To Distribution
                  </DebounceButton>
                </>
              )}
            </>
          )}
        </div>
      )}
      {prize.prestigeAmount && (
        <div className="flex flex-col gap-1 p-2 rounded-md bg-slate-900">
          <div className="flex gap-1">
            <h3>Distribute Prestige</h3>
            <div className="flex gap-1">
              <RiSparkling2Fill /> {prize.prestigeAmount}
            </div>
          </div>
          {distributionData.length > 0 &&
          distributionData.reduce(
            (acc, curr) =>
              curr.prizetype === "prestige" ? acc + curr.amount : acc,
            0
          ) >= prize.prestigeAmount ? (
            <div>Prize fully distributed</div>
          ) : (
            <>
              <Select
                label="Distribute Prestige"
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
              {selectedCompany && (
                <>
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={prestigeAmount.toString()}
                    onChange={(event) =>
                      setPrestigeAmount(Number(event.target.value))
                    }
                    min={0}
                    max={prize.prestigeAmount}
                  />
                  <DebounceButton onClick={handleAddPrestigeDistribution}>
                    Add To Distribution
                  </DebounceButton>
                </>
              )}
            </>
          )}
        </div>
      )}
      {prize.SectorPrizes &&
        prize.SectorPrizes.map((sectorPrize) => {
          const sectorDistributed = distributionData.some(
            (data) =>
              data.prizetype === "passive" &&
              data.companyId &&
              SectorEffects[sectorPrize.Sector.sectorName].passive ===
                data.effectName
          );

          return sectorDistributed ? (
            <div
              key={sectorPrize.sectorId}
              className="flex flex-col gap-1 p-2 rounded-md bg-slate-900"
            >
              <div className="flex gap-1">
                <h3>Distribute Passive Effect</h3>
                <div className="flex flex-col gap-1">
                  <div className="flex gap-1">
                    <RiGameFill />
                    <span>{sectorPrize.Sector.name}</span>
                  </div>
                  <span>
                    {SectorEffects[sectorPrize.Sector.sectorName].passive}
                  </span>
                  <div>Passive Effect fully distributed</div>
                </div>
              </div>
            </div>
          ) : (
            <div
              key={sectorPrize.sectorId}
              className="flex flex-col gap-1 p-2 rounded-md bg-slate-900"
            >
              <div className="flex gap-1">
                <h3>Distribute Passive Effect</h3>
                <div className="flex flex-col gap-1">
                  <div className="flex gap-1">
                    <RiGameFill />
                    <span>{sectorPrize.Sector.name}</span>
                  </div>
                  <span>
                    {SectorEffects[sectorPrize.Sector.sectorName].passive}
                  </span>
                </div>
              </div>
              <Select
                label="Distribute Passive Effect"
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
              {selectedSectorCompany[sectorPrize.sectorId] && (
                <DebounceButton
                  onClick={() =>
                    handleAddPassiveEffectDistribution(
                      sectorPrize.Sector.id,
                      sectorPrize.Sector.sectorName
                    )
                  }
                >
                  Add To Distribution
                </DebounceButton>
              )}
            </div>
          );
        })}
    </div>
  );
};

const DistributionTable = ({
  distributionData,
  setDistributionData,
}: {
  distributionData: DistributionData[];
  setDistributionData: React.Dispatch<React.SetStateAction<DistributionData[]>>;
}) => {
  const { gameState } = useGame();
  const { Company, Player } = gameState;

  const handleRemoveRow = (index: number) => {
    setDistributionData((prevData) => prevData.filter((_, i) => i !== index));
  };

  return (
    <Table
      aria-label="Prize Distribution"
      style={{ height: "auto", minWidth: "100%" }}
    >
      <TableHeader>
        <TableColumn>Prize Type</TableColumn>
        <TableColumn>Target</TableColumn>
        <TableColumn>Amount / Effect</TableColumn>
        <TableColumn>Actions</TableColumn>
      </TableHeader>
      <TableBody>
        {distributionData && distributionData.length > 0 ? (
          distributionData.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.prizetype}</TableCell>
              <TableCell>
                {item.prizetype === "cash" && item.playerId && (
                  <div>
                    {(() => {
                      const player = Player.find((p) => p.id === item.playerId);
                      return (
                        player && <PlayerAvatar player={player} showNameLabel />
                      );
                    })()}
                  </div>
                )}
                {item.prizetype === "prestige" && item.companyId && (
                  <div>
                    {Company.find((c) => c.id === item.companyId)?.name}
                  </div>
                )}
                {item.prizetype === "passive" && item.companyId && (
                  <div>
                    {Company.find((c) => c.id === item.companyId)?.name}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {item.prizetype === "cash" && `$${item.amount}`}
                {item.prizetype === "prestige" && (
                  <div className="flex gap-1 items-center">
                    <RiSparkling2Fill />
                    <span>{item.amount}</span>
                  </div>
                )}
                {item.prizetype === "passive" && (
                  <div className="flex gap-1 items-center">
                    <RiGameFill />
                    <span>{item.effectName}</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => handleRemoveRow(index)}
                  className="text-red-500 hover:underline"
                >
                  <RiCloseCircleFill />
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell>n/a</TableCell>
            <TableCell>n/a</TableCell>
            <TableCell>n/a</TableCell>
            <TableCell>n/a</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

const PrizeDistributionsTable = ({
  prizes,
}: {
  prizes: PrizeWithRelations[];
}) => {
  //flatten prizes.PrizeDistributions
  const prizeDistributions: PrizeDistributionWithRelations[] = prizes.reduce(
    (acc: PrizeDistributionWithRelations[], prize) => {
      if (prize.PrizeDistributions) {
        return [...acc, ...prize.PrizeDistributions];
      }
      return acc;
    },
    [] as PrizeDistributionWithRelations[]
  );

  return (
    <Table>
      <TableHeader>
        <TableColumn>Prize Type</TableColumn>
        <TableColumn>Target</TableColumn>
        <TableColumn>Amount / Effect</TableColumn>
      </TableHeader>
      <TableBody>
        {prizeDistributions.map((prizeDistribution) => (
          <TableRow key={prizeDistribution.id}>
            <TableCell>{prizeDistribution.distributionType}</TableCell>
            <TableCell>
              {prizeDistribution.distributionType ===
                PrizeDistributionType.CASH &&
                prizeDistribution.Player && (
                  <div>
                    <PlayerAvatar
                      player={prizeDistribution.Player}
                      showNameLabel
                    />
                  </div>
                )}
              {prizeDistribution.distributionType ==
                PrizeDistributionType.PRESTIGE &&
                prizeDistribution.Company && (
                  <div>{prizeDistribution.Company.name}</div>
                )}
              {prizeDistribution.distributionType ===
                PrizeDistributionType.PASSIVE_EFFECT &&
                prizeDistribution.Company && (
                  <div>{prizeDistribution.Company.name}</div>
                )}
            </TableCell>
            <TableCell>
              {prizeDistribution.distributionType ===
                PrizeDistributionType.CASH &&
                `$${prizeDistribution.cashAmount}`}
              {prizeDistribution.distributionType ==
                PrizeDistributionType.PRESTIGE && (
                <div className="flex gap-1 items-center">
                  <RiSparkling2Fill />
                  <span>{prizeDistribution.prestigeAmount}</span>
                </div>
              )}
              {prizeDistribution.distributionType ===
                PrizeDistributionType.PASSIVE_EFFECT && (
                <div className="flex gap-1 items-center">
                  <RiGameFill />
                  <span>{prizeDistribution.passiveEffect}</span>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
const DistributePrizes = () => {
  const { currentTurn, authPlayer, currentPhase } = useGame();
  const [distributionData, setDistributionData] = useState<DistributionData[]>(
    []
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(false);
  const {
    data: prizes,
    isLoading,
    isError,
    refetch,
  } = trpc.prizes.listPrizes.useQuery({
    where: {
      gameTurnId: currentTurn.id,
    },
  });
  useEffect(() => {
    refetch();
  }, [currentPhase?.id]);
  const usePrizeDistributionMutation = trpc.game.prizeDistribution.useMutation({
    onSettled: () => {
      setIsLoadingSubmission(false);
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
  const playerPrizes =
    prizes.filter((prize) => prize.playerId === authPlayer.id) || [];

  const handleFinalizeDistribution = () => {
    setIsLoadingSubmission(true);
    setIsSubmitted(true);
    usePrizeDistributionMutation.mutate({
      playerId: authPlayer.id,
      distributionData,
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <h1>Tranches Distribution</h1>
      {prizes.length > 0 ? (
        <>
          {playerPrizes.length > 0 && (
            <>
              {playerPrizes.map((prize) => (
                <div key={prize.id}>
                  {prize.playerId && prize.playerId == authPlayer.id && (
                    <>
                      <DistributePrize
                        prize={prize}
                        setDistributionData={setDistributionData}
                        distributionData={distributionData}
                      />
                    </>
                  )}
                </div>
              ))}
              <h2>Pending Distributions</h2>
              <DistributionTable
                distributionData={distributionData}
                setDistributionData={setDistributionData}
              />
              <div className="flex justify-center">
                <DebounceButton
                  onClick={handleFinalizeDistribution}
                  isLoading={isLoadingSubmission}
                >
                  Finalize Distribution
                </DebounceButton>
              </div>
            </>
          )}
          <h2>All Tranches Distributions</h2>
          <PrizeDistributionsTable prizes={prizes} />
        </>
      ) : (
        <div>No tranches to distribute</div>
      )}
    </div>
  );
};

export default DistributePrizes;
