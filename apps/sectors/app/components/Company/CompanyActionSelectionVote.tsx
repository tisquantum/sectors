import { ArrowDownIcon } from "@heroicons/react/24/solid";
import {
  Avatar,
  AvatarGroup,
  Badge,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "@nextui-org/react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
const companyActions = [
  {
    id: 1,
    title: "Marketing",
    message:
      "Increase the demand for your sector.  On the next OR, you take production (turn) priority regardless of share order.",
  },
  {
    id: 2,
    title: "Research",
    message:
      "Invest in research to gain a competitive edge. Draw one card from the research deck.",
  },
  {
    id: 3,
    title: "Expansion",
    message:
      "Increase company size (base operational costs per OR) and throughput to meet higher demand.",
  },
  {
    id: 4,
    title: "Downsize",
    message:
      "Reduce company size (base operational costs per OR) and throughput to lower operation costs.",
  },
  {
    id: 5,
    title:
      "Veto (Only if the company has more than five (we need maybe change this rule) unique share-holders)",
    message:
      "Ignore the top share holders vote (only passes if minority-majority pick veto) and run a second vote with all other stake-holders.",
  },
];
const CompanyActionSelectionVote = ({
  companyName,
}: {
  companyName: string;
}) => {
  return (
    <div className="flex flex-col gap-3 p-5">
      <h1>{companyName} Vote</h1>
      <div className="flex flex-col gap-3">
        <Card>
          <CardHeader>Operations</CardHeader>
          <CardBody>
            <p>
              The company meets customer demand via it&apos;s throughput and
              makes money based off of it&apos;s unit sales.
            </p>
          </CardBody>
        </Card>
        <ArrowDownIcon className="size-5" />
        <div>
          <h3>Company Action Selection Vote</h3>

          <p>
            The company is considering the following actions. Please vote for
            the action you believe will benefit the company the most.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {companyActions.map((action) => (
            <Card
              key={action.id}
              className={`${action.id == 2 ? "ring ring-blue-500" : ""} ${action.id == 4 ? "ring ring-pink-500" : ""}`}
            >
              <CardHeader>
                <span className="font-bold mr-3">{action.title}</span>
                {action.id == 4 && (
                  <span className="text-pink-500">MAJORITY SHAREHOLDER</span>
                )}
              </CardHeader>
              <CardBody>{action.message}</CardBody>
              <CardFooter>
                <div className="flex flex-col">
                  <span>Vote Total: 7</span>
                  {action.id == 2 && (
                    <span className="text-sky-500">WINNER</span>)}
                  <div className="flex gap-2 my-5">
                    <Badge content="+4" shape="rectangle">
                      <Avatar name={"ANI"} />
                    </Badge>
                    <Badge content="+2" shape="rectangle">
                      <Avatar name={"DOT"} />
                    </Badge>
                    <Badge content="+1" shape="rectangle">
                      <Avatar name={"FUN"} />
                    </Badge>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

const companies = [
  { id: 1, name: "Tech Corp" },
  { id: 2, name: "Health Inc" },
  { id: 3, name: "Finance LLC" },
];

const CompanyActionSlider = () => {
  const [currentCompany, setCurrentCompany] = useState(0);
  const handleNext = () => {
    if (currentCompany < companies.length - 1) {
      setCurrentCompany(currentCompany + 1);
    }
  };
  const handlePrevious = () => {
    if (currentCompany > 0) {
      setCurrentCompany(currentCompany - 1);
    }
  };

  return (
    <div className="flex flex-col flex-grow relative">
      <div className="flex flex-col gap-2 justify-center items-center">
        <h2>Turn Order</h2>
        <div className="flex gap-2">
          <Avatar name="MEET" />
          {companies.map((company, index) => (
            <Avatar key={company.id} name={company.name} />
          ))}
        </div>
        <button onClick={handlePrevious}>Previous</button>
        <button onClick={handleNext}>Next</button>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={companies[currentCompany].id}
          initial={{ opacity: 0, x: 200 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -200 }}
          className={`flex justify-center items-center`}
        >
          <CompanyActionSelectionVote
            companyName={companies[currentCompany].name}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CompanyActionSlider;
