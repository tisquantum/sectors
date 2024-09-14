import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { HeadlineLocation, HeadlineType } from "@server/prisma/prisma.client";
import { RiArrowUpWideLine, RiMoneyDollarBoxFill } from "@remixicon/react";
import { HeadlineWithRelations } from "@server/prisma/prisma.types";
import CompanyComponent from "../Company/Company";
import PlayerAvatar from "../Player/PlayerAvatar";
import { motion } from "framer-motion";

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
      <div className="text-green-500 flex flex-col">&gt;</div>
    )}
    {(headlineType === HeadlineType.COMPANY_POSITIVE_2 ||
      headlineType === HeadlineType.SECTOR_POSITIVE_2) && (
      <div className="text-green-500 flex flex-col">&gt;&gt;</div>
    )}
    {headlineType === HeadlineType.COMPANY_POSITIVE_3 ||
      (headlineType === HeadlineType.SECTOR_POSITIVE_3 && (
        <div className="text-green-500 flex flex-col">&gt;&gt;&gt;</div>
      ))}
    {(headlineType === HeadlineType.COMPANY_NEGATIVE_1 ||
      headlineType === HeadlineType.SECTOR_NEGATIVE_1) && (
      <div className="text-red-500 flex flex-col">&lt;</div>
    )}
    {(headlineType === HeadlineType.COMPANY_NEGATIVE_2 ||
      headlineType === HeadlineType.SECTOR_NEGATIVE_2) && (
      <div className="text-red-500 flex flex-col">&lt;&lt;</div>
    )}
    {(headlineType === HeadlineType.COMPANY_NEGATIVE_3 ||
      headlineType === HeadlineType.SECTOR_NEGATIVE_3) && (
      <div className="text-red-500 flex flex-col">&lt;&lt;&lt;</div>
    )}
  </div>
);

const HeadlineComponent = ({
  headline,
}: {
  headline: Partial<HeadlineWithRelations>;
}) => (
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
        {headline.title}
      </motion.div>
    </div>
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
        <CompanyComponent company={headline.company} />
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
    <motion.div
      className="flex text-green-500 text-lg flex justify-end items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <RiMoneyDollarBoxFill className="mr-1" />
      {headline.cost}
    </motion.div>
    {/* <motion.div
      className="flex space-x-2 mt-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      {headline.playerHeadlines.map((playerHeadline) => (
        <PlayerAvatar key={playerHeadline.id} player={playerHeadline.player} />
      ))}
    </motion.div> */}
  </motion.div>
);

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
  const { gameId, currentTurn } = useGame();
  const {
    data: headlines,
    isLoading,
    isError,
  } = trpc.headlines.listHeadlines.useQuery({
    where: {
      gameId,
      headlineLocation: HeadlineLocation.FOR_SALE,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return (
    <div className="bg-gray-50 p-8 shadow-lg rounded-lg max-w-3xl mx-auto">
      <div className="border-b-4 border-black mb-4">
        <h2 className="text-4xl font-serif text-center text-black mb-2">
          Today&apos;s Headlines
        </h2>
      </div>
      <p className="text-xl text-gray-700 font-light mb-6">
        The following headlines are being pushed, put money on a headline to
        influence the medias narrative.
      </p>
      {/* {isLoading && <div>Loading...</div>}
      {isError && <div>Error loading headlines</div>}
      {headlines?.map((headline) => (
        <div key={headline.id}>
          <HeadlineComponent headline={headline} />
        </div>
      ))} */}
      <div className="grid grid-cols-3 gap-6">
        <HeadlineSlot headline={sampleHeadlines[0]} />
        <HeadlineSlot headline={sampleHeadlines[1]} />
        <HeadlineSlot headline={sampleHeadlines[2]} />
      </div>
    </div>
  );
};

export default Headlines;
