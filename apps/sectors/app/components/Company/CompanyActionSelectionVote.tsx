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
import { useEffect, useState } from "react";
import CompanyActionVote from "./CompanyActionVote";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";
import { getCompanyOperatingRoundTurnOrder } from "@server/data/constants";
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
    title: "Share Buyback",
    message:
      "Buy back a share from the open market. This share is taken out of rotation from the game.",
  },
  {
    id: 6,
    title: "Share Issue",
    message: "Issue a share to the open market.",
  },
  {
    id: 7,
    title: "Spend Prestige",
    message: "Spend 3 prestige to increase the unit price for the company.",
  },
];
const CompanyActionSelectionVote = ({
  companyName,
}: {
  companyName: string;
}) => {
  return (
    <div className="flex flex-col gap-3 p-5">
      <h1 className="text-2xl">{companyName} Shareholder Meeting</h1>
      <div className="flex flex-col gap-3">
        <div>
          <h3>Company Action Selection Vote</h3>

          <p>
            The company is considering the following actions. Please vote for
            the action you believe will benefit the company the most.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {companyActions.map((action) => (
            <Card key={action.id}>
              <CardHeader>
                <span className="font-bold mr-3">{action.title}</span>
              </CardHeader>
              <CardBody>{action.message}</CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

const CompanyActionSlider = () => {
  const { gameId, currentPhase } = useGame();
  const {
    data: companies,
    isLoading: isLoadingCompanies,
    error,
  } = trpc.company.listCompaniesWithSector.useQuery({
    where: { gameId },
  });
  const [currentCompany, setCurrentCompany] = useState<string | undefined>(
    undefined
  );
  useEffect(() => {
    if (companies && currentPhase) {
      setCurrentCompany(
        companies.find(
          (company) => company.id === (currentPhase.companyId || "")
        )?.id
      );
    }
  }, [companies, currentPhase]);
  if (isLoadingCompanies) return <div>Loading...</div>;
  if (!companies) return <div>No companies found</div>;
  if (!currentPhase) return <div>No current phase found</div>;
  if (error) return <div>Error: {error.message}</div>;
  const companiesSortedForTurnOrder =
    getCompanyOperatingRoundTurnOrder(companies);
  //I thought originally I'd get rid of this, but now I'm thinking
  //of preserving this behavior so players can flip through orders to review votes of other companies if they want.
  const handleNext = () => {
    setCurrentCompany((prev) => {
      if (!prev) return companiesSortedForTurnOrder[0].id;
      const currentIndex = companies.findIndex(
        (company) => company.id === prev
      );
      if (currentIndex === companies.length - 1)
        return companiesSortedForTurnOrder[0].id;
      return companies[currentIndex + 1].id;
    });
  };
  const handlePrevious = () => {
    setCurrentCompany((prev) => {
      if (!prev) return companiesSortedForTurnOrder[0].id;
      const currentIndex = companies.findIndex(
        (company) => company.id === prev
      );
      if (currentIndex === 0)
        return companiesSortedForTurnOrder[companies.length - 1].id;
      return companies[currentIndex - 1].id;
    });
  };
  return (
    <div className="flex flex-col flex-grow relative">
      <div className="flex flex-col gap-2 justify-center items-center">
        <h2>Turn Order</h2>
        <div className="flex gap-2">
          {companiesSortedForTurnOrder.map((company, index) => (
            <Avatar
              key={company.id}
              name={company.name}
              className={
                currentCompany === company.id ? "ring-2 ring-blue-500" : ""
              }
            />
          ))}
        </div>
        <button onClick={handlePrevious}>Previous</button>
        <button onClick={handleNext}>Next</button>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentCompany}
          initial={{ opacity: 0, x: 200 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -200 }}
          className={`flex justify-center items-center`}
        >
          <div className="flex flex-col justify-center items-center">
            <CompanyActionSelectionVote
              companyName={
                companies.find((company) => company.id === currentCompany)
                  ?.name || ""
              }
            />
            <CompanyActionVote
              company={companies.find(
                (company) => company.id === currentCompany
              )}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CompanyActionSlider;
