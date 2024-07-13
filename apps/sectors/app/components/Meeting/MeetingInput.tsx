import { Select, SelectItem, SelectSection } from "@nextui-org/react";
import { ChangeEvent, ChangeEventHandler, useState } from "react";
import { Topic, TopicKey, topics } from "./data";
import PlayerSelect from "../Game/PlayerSelect";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";
import { organizeCompaniesBySector } from "@sectors/app/helpers";
import Button from "@sectors/app/components/General/DebounceButton";

type SelectChangeEvent = ChangeEvent<HTMLSelectElement>;

const Complement = ({
  onChange,
}: {
  onChange: (e: SelectChangeEvent) => void;
}) => {
  return (
    <Select
      label="Complement"
      placeholder="Select a complement"
      className="max-w-xs"
      description="The subject of discussion"
      onChange={onChange}
    >
      <SelectItem key="is">is</SelectItem>
      <SelectItem key="is_not">is not</SelectItem>
      <SelectItem key="intends_to">intends to</SelectItem>
      <SelectItem key="does_not_intend_to">does not intend to</SelectItem>
    </Select>
  );
};

const PlayerSubject = ({
  onChange,
}: {
  onChange: (e: SelectChangeEvent) => void;
}) => {
  return (
    <Select
      label="Subject"
      placeholder="Select a subject"
      className="max-w-xs"
      description="The subject of discussion"
      onChange={onChange}
    >
      <SelectItem key="buy">buy</SelectItem>
      <SelectItem key="buying">buying</SelectItem>
      <SelectItem key="sell">sell</SelectItem>
      <SelectItem key="selling">selling</SelectItem>
      <SelectItem key="trade">trade</SelectItem>
      <SelectItem key="trading">trading</SelectItem>
    </Select>
  );
};

const PlayerTopic = ({
  onChange,
}: {
  onChange: (e: SelectChangeEvent) => void;
}) => {
  const { gameId } = useGame();
  const { data: companies, isLoading } = trpc.company.listCompanies.useQuery({
    where: { gameId },
  });
  const { data: sectors, isLoading: sectorsLoading } =
    trpc.sector.listSectors.useQuery({
      where: { gameId },
    });
  if (isLoading || sectorsLoading) return null;
  if (companies == undefined || sectors == undefined) return null;
  return (
    <Select
      label="Player Topic"
      placeholder="Select a topic"
      className="max-w-xs"
      onChange={onChange}
    >
      <SelectSection showDivider title="companies">
        {companies.map((company) => (
          <SelectItem key={company.id}>{company.name}</SelectItem>
        ))}
      </SelectSection>
      <SelectSection title="sectors">
        {sectors.map((sector) => (
          <SelectItem key={sector.id}>{sector.name}</SelectItem>
        ))}
      </SelectSection>
    </Select>
  );
};

const CompanyTopic = ({
  onChange,
}: {
  onChange: (e: SelectChangeEvent) => void;
}) => {
  const { gameId } = useGame();
  const { data: companies, isLoading } =
    trpc.company.listCompaniesWithSector.useQuery({
      where: { gameId },
    });
  if (isLoading) return null;
  if (companies == undefined) return null;
  //organize companies by sector
  const companiesBySector = organizeCompaniesBySector(companies);
  return (
    <Select
      label="Company Topic"
      placeholder="Select a topic"
      className="max-w-xs"
      onChange={onChange}
    >
      {Object.entries(companiesBySector).map(
        ([sectorId, { sector, companies }]) => (
          <SelectSection key={sectorId} title={sector.name}>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.name}>
                {company.name}
              </SelectItem>
            ))}
          </SelectSection>
        )
      )}
    </Select>
  );
};

const CompanySubject = ({
  onChange,
}: {
  onChange: (e: SelectChangeEvent) => void;
}) => {
  return (
    <Select
      label="Subject"
      placeholder="Select a subject"
      className="max-w-xs"
      description="The subject of discussion"
      onChange={onChange}
    >
      <SelectItem key="ready_to_run" value="ready_to_run">
        ready to run.
      </SelectItem>
      <SelectItem key="trash" value="trash">
        trash.
      </SelectItem>
      <SelectItem key="looking_stale" value="looking_stale">
        looking stale.
      </SelectItem>
      <SelectItem key="needs_better_leadership" value="needs_better_leadership">
        needs better leadership.
      </SelectItem>
    </Select>
  );
};

const SectorTopic = ({ onChange }: { onChange: (e: string) => void }) => {
  const { gameId } = useGame();
  const { data: sectors, isLoading } = trpc.sector.listSectors.useQuery({
    where: { gameId },
  });
  if (isLoading) return null;
  if (sectors == undefined) return null;

  const handleChange = (e: SelectChangeEvent) => {
    const sectorName = sectors.find(
      (sector) => sector.id === e.target.value
    )?.name;
    onChange(sectorName || "");
  };
  return (
    <Select
      label="Sector Topic"
      placeholder="Select a topic"
      className="max-w-xs"
      onChange={handleChange}
    >
      {sectors.map((sector) => (
        <SelectItem key={sector.id} value={sector.name}>
          {sector.name}
        </SelectItem>
      ))}
    </Select>
  );
};

const SectorSubject = ({
  onChange,
}: {
  onChange: (e: SelectChangeEvent) => void;
}) => {
  return (
    <Select
      label="Subject"
      placeholder="Select a subject"
      className="max-w-xs"
      description="The subject of discussion"
      onChange={onChange}
    >
      <SelectItem key="booming">booming.</SelectItem>
      <SelectItem key="crashing">crashing.</SelectItem>
      <SelectItem key="stable">stable.</SelectItem>
      <SelectItem key="unstable">unstable.</SelectItem>
    </Select>
  );
};

const MeetingInput = () => {
  const { gameId, authPlayer } = useGame();
  const meetingMessageMutation =
    trpc.meetingMessage.createMessage.useMutation();
  const [isSubmit, setIsSubmit] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | undefined>(
    undefined
  );
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [selectedComplement, setSelectedComplement] = useState("");
  const [selectedPlayerSubject, setSelectedPlayerSubject] = useState("");
  const [selectedPlayerTopic, setSelectedPlayerTopic] = useState("");
  const [selectedCompanyTopic, setSelectedCompanyTopic] = useState("");
  const [selectedCompanySubject, setSelectedCompanySubject] = useState("");
  const [selectedSectorTopic, setSelectedSectorTopic] = useState("");
  const [selectedSectorSubject, setSelectedSectorSubject] = useState("");

  const handleTopicChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    const topic = topics.find(
      (topic) => topic.key === (e.target.value as TopicKey)
    ) as Topic | undefined;
    if (topic) {
      setSelectedTopic(topic);
    }
  };

  const handleSubmitMessage = () => {
    setIsSubmit(true);
    let content = "test";
    if (selectedTopic?.key === "player") {
      content = `${selectedPlayer} ${selectedComplement} ${selectedPlayerSubject} ${selectedPlayerTopic}`;
    } else if (selectedTopic?.key === "company") {
      content = `${selectedCompanyTopic} ${selectedComplement} ${selectedCompanySubject}`;
    } else if (selectedTopic?.key === "sector") {
      content = `${selectedSectorTopic} ${selectedComplement} ${selectedSectorSubject}`;
    }
    meetingMessageMutation.mutate(
      {
        content,
        gameId,
        playerId: authPlayer.id,
        gameStep: 1,
        timestamp: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          setIsSubmit(false);
        },
        onError: () => {
          setIsSubmit(false);
        },
      }
    );
  };

  return (
    <div className="flex flex-col justify-center content-center">
      <Select
        label="Topic"
        placeholder="Select a topic"
        className="max-w-md"
        description="Your point of discussion"
        onChange={handleTopicChange}
      >
        {topics.map((topic) => (
          <SelectItem key={topic.key}>{topic.label}</SelectItem>
        ))}
      </Select>
      {selectedTopic?.key == "player" && (
        <div className="grid grid-cols-4 gap-4 mt-4 w-full">
          <PlayerSelect onChange={(e) => setSelectedPlayer(e.target.value)} />
          <Complement onChange={(e) => setSelectedComplement(e.target.value)} />
          <PlayerSubject
            onChange={(e) => setSelectedPlayerSubject(e.target.value)}
          />
          <PlayerTopic
            onChange={(e) => setSelectedPlayerTopic(e.target.value)}
          />
        </div>
      )}
      {selectedTopic?.key == "company" && (
        <div className="grid grid-cols-4 gap-4 mt-4 w-full">
          <CompanyTopic
            onChange={(e) => setSelectedCompanyTopic(e.target.value)}
          />
          <Complement onChange={(e) => setSelectedComplement(e.target.value)} />
          <CompanySubject
            onChange={(e) => setSelectedCompanySubject(e.target.value)}
          />
        </div>
      )}
      {selectedTopic?.key == "sector" && (
        <div className="grid grid-cols-4 gap-4 mt-4 w-full">
          <SectorTopic
            onChange={(sectorName) => setSelectedSectorTopic(sectorName)}
          />
          <Complement onChange={(e) => setSelectedComplement(e.target.value)} />
          <SectorSubject
            onChange={(e) => setSelectedSectorSubject(e.target.value)}
          />
        </div>
      )}
      <Button
        className="mt-4"
        disabled={!selectedTopic && !isSubmit}
        onClick={handleSubmitMessage}
      >
        Submit
      </Button>
    </div>
  );
};

export default MeetingInput;
