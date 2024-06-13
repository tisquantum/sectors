import { Button, RadioGroup, Radio } from "@nextui-org/react";

const CompanyActionVote = () => {
  return (
    <div className="flex flex-col items-center justify-center max-w-2xl">
      <h1 className="text-2xl font-bold">Vote on the company action</h1>
      <RadioGroup color="warning" orientation="horizontal">
        <Radio value="marketing">
          Marketing
        </Radio>
        <Radio value="research">
          Research
        </Radio>
        <Radio value="expansion">
          Expansion
        </Radio>
        <Radio value="downsize">
          Downsize
        </Radio>
        <Radio value="veto">
          Veto
        </Radio>
      </RadioGroup>
      <div className="flex flex-col items-center justify-center">
        <Button className="btn btn-primary">Submit Vote</Button>
      </div>
    </div>
  );
};

export default CompanyActionVote;
