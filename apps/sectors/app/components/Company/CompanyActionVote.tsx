import { Button, RadioGroup, Radio } from "@nextui-org/react";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";
import { Company, OperatingRoundAction } from "@server/prisma/prisma.client";
import { useState } from "react";
import { CompanyActionCosts } from "@server/data/constants";

const CompanyActionVote = ({ company }: { company?: Company }) => {
  const { currentPhase, authPlayer } = useGame();
  const [selected, setSelected] = useState<OperatingRoundAction>(
    OperatingRoundAction.MARKETING
  );
  const [submitComplete, setSubmitComplete] = useState(false);
  const createOperatingRoundVote =
    trpc.operatingRoundVote.createOperatingRoundVote.useMutation();
  if (!company) return null;
  const handleSubmit = async () => {
    try {
      await createOperatingRoundVote.mutate({
        operatingRoundId: currentPhase?.operatingRoundId || 0,
        playerId: authPlayer.id,
        companyId: company.id,
        actionVoted: selected,
      });
      setSubmitComplete(true);
    } catch (error) {
      console.error(error);
    }
  };
  const actions = [
    { name: OperatingRoundAction.MARKETING, label: "Marketing" },
    { name: OperatingRoundAction.RESEARCH, label: "Research" },
    { name: OperatingRoundAction.EXPANSION, label: "Expansion" },
    { name: OperatingRoundAction.DOWNSIZE, label: "Downsize" },
    { name: OperatingRoundAction.MERGE, label: "Merge" },
    { name: OperatingRoundAction.SHARE_BUYBACK, label: "Buyback Shares" },
    { name: OperatingRoundAction.SHARE_ISSUE, label: "Issue Shares" },
    { name: OperatingRoundAction.SPEND_PRESTIGE, label: "Prestige" },
    { name: OperatingRoundAction.VETO, label: "Veto" }
  ];
  return (
    <div className="flex flex-col items-center justify-center max-w-2xl">
      <h1 className="text-2xl font-bold">
        Vote on {company.name} company action
      </h1>
      <RadioGroup
        color="warning"
        orientation="horizontal"
        value={selected}
        onValueChange={(value) => setSelected(value as OperatingRoundAction)}
      >
        {actions
          .filter(
            (action) => CompanyActionCosts[action.name] <= company.cashOnHand
          )
          .map((action) => (
            <Radio key={action.name} value={action.name}>
              {action.label}
            </Radio>
          ))}
      </RadioGroup>
      <div className="flex flex-col items-center justify-center">
        {currentPhase?.companyId === company.id ? (
          submitComplete ? (
            <div>Vote Submitted</div>
          ) : (
            <Button className="btn btn-primary" onClick={handleSubmit}>
              Submit Vote
            </Button>
          )
        ) : (
          <Button disabled className="btn btn-primary">
            Return to the phasing company to vote.
          </Button>
        )}
      </div>
    </div>
  );
};

export default CompanyActionVote;
