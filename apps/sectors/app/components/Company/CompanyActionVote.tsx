import { Button, RadioGroup, Radio } from "@nextui-org/react";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";
import { Company, OperatingRoundAction } from "@server/prisma/prisma.client";
import { useState } from "react";

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
        <Radio value={OperatingRoundAction.MARKETING}>Marketing</Radio>
        <Radio value={OperatingRoundAction.RESEARCH}>Research</Radio>
        <Radio value={OperatingRoundAction.EXPANSION}>Expansion</Radio>
        <Radio value={OperatingRoundAction.DOWNSIZE}>Downsize</Radio>
        <Radio value={OperatingRoundAction.MERGE}>Merge</Radio>
        <Radio value={OperatingRoundAction.SHARE_BUYBACK}>Buyback Shares</Radio>
        <Radio value={OperatingRoundAction.SHARE_ISSUE}>Issue Shares</Radio>
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
