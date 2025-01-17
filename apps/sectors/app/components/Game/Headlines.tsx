import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import {
  HeadlineLocation,
  HeadlineType,
  PhaseName,
} from "@server/prisma/prisma.client";
import { RiArrowUpWideLine, RiMoneyDollarBoxFill } from "@remixicon/react";
import { HeadlineWithRelations } from "@server/prisma/prisma.types";
import CompanyComponent from "../Company/Company";
import PlayerAvatar from "../Player/PlayerAvatar";
import { motion } from "framer-motion";
import DebounceButton from "../General/DebounceButton";
import { useEffect, useState } from "react";
import SectorPriority from "./SectorPriority";
import { toast } from "sonner";
import { EVENT_NEW_PLAYER_HEADLINE } from "@server/pusher/pusher.types";
import { set } from "lodash";

const sampleHeadlines = [
  {
    id: "1",
    saleSlot: 1,
    type: HeadlineType.COMPANY_POSITIVE_2,
    title: "Tech Giants Merge to Form New Powerhouse",
    description:
      "In a historic move, two of the largest technology companies announce a merger that will reshape the industry.",
    cost: 500,
  },
  {
    id: "2",
    saleSlot: 2,
    type: HeadlineType.SECTOR_NEGATIVE_2,
    title: "Renewable Energy Takes Lead in Global Markets",
    description:
      "Renewable energy companies see a significant boost as governments push for greener policies.",
    cost: 300,
  },
  {
    id: "3",
    saleSlot: 3,
    type: HeadlineType.COMPANY_NEGATIVE_2,
    title: "Healthcare Innovations Disrupt Industry Norms",
    description:
      "Groundbreaking healthcare technologies are making treatments more accessible and affordable for millions.",
    cost: 400,
  },
  {
    id: "4",
    saleSlot: 4,
    type: HeadlineType.SECTOR_POSITIVE_1,
    title: "Luxury Brands Experience Surge in Global Demand",
    description:
      "Luxury goods see unprecedented growth as emerging markets drive demand.",
    cost: 600,
  },
  {
    id: "5",
    saleSlot: 5,
    type: HeadlineType.SECTOR_POSITIVE_2,
    title: "Global Shipping Crisis Slows Down Supply Chains",
    description:
      "Shipping delays across the globe are causing major disruptions to supply chains in all sectors.",
    cost: 200,
  },
];

const HeadlineTypeComponent = ({
  headlineType,
}: {
  headlineType: HeadlineType;
}) => (
  <div className="text-lg">
    {(headlineType === HeadlineType.COMPANY_POSITIVE_1 ||
      headlineType === HeadlineType.SECTOR_POSITIVE_1) && (
      <div className="text-green-500 flex flex-col">&lt;</div>
    )}
    {(headlineType === HeadlineType.COMPANY_POSITIVE_2 ||
      headlineType === HeadlineType.SECTOR_POSITIVE_2) && (
      <div className="text-green-500 flex flex-col">&lt;&lt;</div>
    )}
    {headlineType === HeadlineType.COMPANY_POSITIVE_3 ||
      (headlineType === HeadlineType.SECTOR_POSITIVE_3 && (
        <div className="text-green-500 flex flex-col">&lt;&lt;&lt;</div>
      ))}
    {(headlineType === HeadlineType.COMPANY_NEGATIVE_1 ||
      headlineType === HeadlineType.SECTOR_NEGATIVE_1) && (
      <div className="text-red-500 flex flex-col">&gt;</div>
    )}
    {(headlineType === HeadlineType.COMPANY_NEGATIVE_2 ||
      headlineType === HeadlineType.SECTOR_NEGATIVE_2) && (
      <div className="text-red-500 flex flex-col">&gt;&gt;</div>
    )}
    {(headlineType === HeadlineType.COMPANY_NEGATIVE_3 ||
      headlineType === HeadlineType.SECTOR_NEGATIVE_3) && (
      <div className="text-red-500 flex flex-col">&gt;&gt;&gt;</div>
    )}
  </div>
);

const HeadlineComponent = ({
  headline,
}: {
  headline: Partial<HeadlineWithRelations>;
}) => {
  const { currentPhase, currentTurn, gameId, authPlayer } = useGame();
  const {
    data: companyWithSector,
    isLoading: isLoadingCompany,
    isError,
  } = trpc.company.companyWithSectorFindFirst.useQuery(
    {
      where: {
        gameId,
      },
      orderBy: {
        createdAt: "desc",
      },
    },
    {
      enabled: currentTurn.turn % 3 === 0,
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [submitComplete, setSubmitComplete] = useState(false);
  const handleCreatePlayerHeadlineMutation =
    trpc.playerHeadlines.createPlayerHeadline.useMutation({
      onSettled: () => {
        setIsLoading(false);
      },
      onSuccess: () => {
        setSubmitComplete(true);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  const handlePurchaseHeadline = async () => {
    setIsLoading(true);
    if (headline.id && authPlayer?.id) {
      handleCreatePlayerHeadlineMutation.mutate({
        headlineId: headline.id,
        gameTurnId: currentTurn?.id,
        gameId,
        playerId: authPlayer?.id,
      });
    }
  };

  //Only capitalize the first letter of a string, the rest should be lowercase
  const makeSentenceCase = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <motion.div
      className="p-3 bg-slate-200 rounded-lg border border-gray-300 shadow-md flex flex-col justify-between h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex justify-between items-center mb-4">
        <motion.div
          className="text-2xl font-bold text-gray-800"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
        >
          {makeSentenceCase(headline.title || "")}
        </motion.div>
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col gap-1">
          {currentTurn.turn % 3 === 0 && (
            <motion.div
              className="flex flex-col justify-center items-center bg-black p-6 rounded-md mt-4 shadow-2xl border border-green-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              <motion.p
                className="text-2xl font-semibold text-green-400 mb-2"
                initial={{ x: -10 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.5 }}
              >
                A new company has opened in {companyWithSector?.Sector.name},
                welcome {companyWithSector?.name}!
              </motion.p>
              <motion.div
                className="mt-4 w-full h-1 bg-green-400 rounded"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 2 }}
              />
            </motion.div>
          )}
          {headline.type && (
            <motion.div
              className="text-gray-600"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <HeadlineTypeComponent headlineType={headline.type} />
            </motion.div>
          )}
          {headline.company && (
            <motion.div
              className="mb-4"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {headline.company && headline.sector && (
                <CompanyComponent
                  company={{ ...headline.company, Sector: headline.sector }}
                />
              )}
            </motion.div>
          )}

          {headline.sector && (
            <motion.div
              className="text-sm text-gray-500"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {headline.sector.name}
            </motion.div>
          )}
        </div>
        <motion.div
          className="flex text-green-500 text-lg flex justify-end items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <RiMoneyDollarBoxFill className="mr-1" />
          {headline.cost}
        </motion.div>
      </div>
      {currentPhase?.name == PhaseName.START_TURN && (
        <div>
          {submitComplete ? (
            <div className="bg-slate-600 bordered-md p-2">
              Headline purchased
            </div>
          ) : (
            <DebounceButton
              onClick={handlePurchaseHeadline}
              className="p-2"
              isLoading={isLoading}
            >
              Buy/Split Headline
            </DebounceButton>
          )}
        </div>
      )}
      {headline.playerHeadlines && headline.playerHeadlines?.length > 0 && (
        <motion.div
          className="flex space-x-2 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {headline.playerHeadlines?.map((playerHeadline) => (
            <PlayerAvatar
              key={playerHeadline.id}
              player={playerHeadline.player}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

const HeadlineSlot = ({
  headline,
}: {
  headline: Partial<HeadlineWithRelations>;
}) => {
  return (
    <div className="p-6 flex flex-col justify-between border border-gray-300">
      <div className="flex gap-2 justify-center items-center mb-4">
        <motion.div
          className="text-2xl font-bold text-gray-800"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
        >
          {headline.saleSlot}
        </motion.div>
      </div>
      <HeadlineComponent headline={headline} />
    </div>
  );
};

const Headlines = () => {
  const { gameId, currentTurn, socketChannel: channel } = useGame();
  const {
    data: headlines,
    refetch,
    isLoading,
    isError,
  } = trpc.headlines.listHeadlines.useQuery({
    where: {
      gameId,
      location: HeadlineLocation.FOR_SALE,
      saleSlot: {
        not: null,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  useEffect(() => {
    if (!channel) return;

    channel.bind(EVENT_NEW_PLAYER_HEADLINE, () => {
      refetch();
    });

    return () => {
      channel.unbind(EVENT_NEW_PLAYER_HEADLINE);
    };
  }, [channel, isLoading]);
  return (
    <div className="flex flex-col justify-center items-center bg-gray-200 p-8 shadow-lg rounded-lg max-w-3xl mx-auto">
      <div className="border-b-4 border-black mb-4">
        <h2 className="text-4xl font-serif text-center text-black mb-2">
          Today&apos;s Headlines
        </h2>
      </div>
      <SectorPriority />
      <p className="text-xl text-gray-700 font-light mb-6">
        The following headlines are being pushed, put money on a headline to
        influence the medias narrative. If more than one player elects to
        purchase a headline, the cost is split amongst all players on that
        headline.
      </p>
      {isLoading && <div>Loading...</div>}
      {isError && <div>Error loading headlines</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {headlines
          ?.sort((a, b) => (a?.saleSlot || 0) - (b?.saleSlot || 0))
          .map((headline) => (
            <div key={headline.id}>
              <HeadlineSlot headline={headline} />
            </div>
          ))}
      </div>
    </div>
  );
};

export default Headlines;
