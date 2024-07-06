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
import {
  CompanyStatus,
  OperatingRoundAction,
  OperatingRoundVote,
} from "@server/prisma/prisma.client";
import ShareComponent from "./Share";
import { OperatingRoundVoteWithPlayer } from "@server/prisma/prisma.types";
const companyActions = [
  {
    id: 1,
    title: "Marketing",
    name: OperatingRoundAction.MARKETING,
    message:
      "Increase the demand for your sector.  On the next OR, you take production (turn) priority regardless of share order.",
  },
  {
    id: 2,
    title: "Research",
    name: OperatingRoundAction.RESEARCH,
    message:
      "Invest in research to gain a competitive edge. Draw one card from the research deck.",
  },
  {
    id: 3,
    title: "Expansion",
    name: OperatingRoundAction.EXPANSION,
    message:
      "Increase company size (base operational costs per OR) and throughput to meet higher demand.",
  },
  {
    id: 4,
    title: "Downsize",
    name: OperatingRoundAction.DOWNSIZE,
    message:
      "Reduce company size (base operational costs per OR) and throughput to lower operation costs.",
  },
  {
    id: 5,
    title: "Share Buyback",
    name: OperatingRoundAction.SHARE_BUYBACK,
    message:
      "Buy back a share from the open market. This share is taken out of rotation from the game.",
  },
  {
    id: 6,
    title: "Share Issue",
    name: OperatingRoundAction.SHARE_ISSUE,
    message: "Issue a share to the open market.",
  },
  {
    id: 7,
    title: "Spend Prestige",
    name: OperatingRoundAction.SPEND_PRESTIGE,
    message: "Spend 3 prestige to increase the unit price for the company.",
  },
];
const CompanyActionSelectionVote = ({
  companyName,
  actionVoteResults,
}: {
  companyName: string;
  actionVoteResults?: OperatingRoundVoteWithPlayer[];
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
              <CardFooter>
                {actionVoteResults && (
                  <div className="flex flex-col gap-2">
                    {actionVoteResults
                      .filter(
                        (actionVoteResult) =>
                          actionVoteResult.actionVoted == action.name
                      )
                      .map((action: OperatingRoundVoteWithPlayer) => (
                        <ShareComponent
                          key={action.id}
                          quantity={
                            action.Player.Share.filter(
                              (share) => share.companyId === action.companyId
                            ).length
                          }
                          name={action.Player.nickname}
                        />
                      ))}
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

const CompanyActionSlider = ({ withResult }: { withResult?: boolean }) => {
  const { gameId, currentPhase } = useGame();
  const {
    data: companies,
    isLoading: isLoadingCompanies,
    error,
  } = trpc.company.listCompaniesWithSector.useQuery({
    where: { gameId, status: CompanyStatus.ACTIVE },
  });
  const { data: companyVoteResults, isLoading: isLoadingCompanyVoteResults } =
    trpc.operatingRound.getOperatingRoundWithActionVotes.useQuery(
      {
        where: {
          id: currentPhase?.operatingRoundId || "",
        },
      },
      {
        enabled: withResult,
      }
    );
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
  if (withResult && isLoadingCompanyVoteResults) return <div>Loading...</div>;
  if (withResult && !companyVoteResults) return <div>No results found</div>;
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
              actionVoteResults={companyVoteResults?.operatingRoundVote.filter(
                (vote) => vote.companyId === currentCompany
              )}
            />
            {!withResult && (
              <CompanyActionVote
                company={companies.find(
                  (company) => company.id === currentCompany
                )}
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CompanyActionSlider;
