import { Select, SelectItem, SelectSection } from "@nextui-org/react";
import { ChangeEventHandler, useState } from "react";
import { Topic, TopicKey, topics } from "./data";
import PlayerSelect from "../Game/PlayerSelect";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";

const PlayerComplement = () => {
  return (
    <Select
      label="Subject"
      placeholder="Select a subject"
      className="max-w-xs"
      description="The subject of discussion"
    >
      <SelectItem key="is">is</SelectItem>
      <SelectItem key="is_not">is not</SelectItem>
      <SelectItem key="intends to">intends to</SelectItem>
      <SelectItem key="does not intend to">does not intend to</SelectItem>
    </Select>
  );
};

const PlayerSubject = () => {
  return (
    <Select
      label="Subject"
      placeholder="Select a subject"
      className="max-w-xs"
      description="The subject of discussion"
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

const PlayerTopic = () => {
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
      label="Player Subject"
      placeholder="Select a Subject"
      className="max-w-xs"
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

const MeetingInput = () => {
  const [selectedTopic, setSelectedTopic] = useState<Topic | undefined>(
    undefined
  );
  const handleTopicChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    const topic = topics.find(
      (topic) => topic.key === (e.target.value as TopicKey)
    ) as Topic | undefined;
    if (topic) {
      setSelectedTopic(topic);
    }
  };
  return (
    <div>
      <Select
        label="Topic"
        placeholder="Select a topic"
        className="max-w-xs"
        description="Your point of discussion"
        onChange={handleTopicChange}
      >
        {topics.map((topic) => (
          <SelectItem key={topic.key}>{topic.label}</SelectItem>
        ))}
      </Select>
      {selectedTopic?.key == "player" && (
        <div>
          <PlayerSelect />
          <PlayerComplement />
          <PlayerSubject />
          <PlayerComplement />
          <PlayerTopic />
        </div>
      )}
    </div>
  );
};

export default MeetingInput;
