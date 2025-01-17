import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { motion } from "framer-motion";
import { autocomplete } from "@nextui-org/react";

const financialQuotes = [
  {
    quote:
      "The stock market is filled with individuals who know the price of everything, but the value of nothing.",
    author: "Phillip Fisher",
  },
  {
    quote:
      "The four most dangerous words in investing are: 'This time it's different.'",
    author: "Sir John Templeton",
  },
  {
    quote:
      "The stock market is a device for transferring money from the impatient to the patient.",
    author: "Warren Buffett",
  },
  {
    quote:
      "In the short run, the market is a voting machine, but in the long run, it is a weighing machine.",
    author: "Benjamin Graham",
  },
  {
    quote:
      "The investor's chief problem—and even his worst enemy—is likely to be himself.",
    author: "Benjamin Graham",
  },
  {
    quote:
      "The individual investor should act consistently as an investor and not as a speculator.",
    author: "Benjamin Graham",
  },
  {
    quote:
      "It's not whether you're right or wrong that's important, but how much money you make when you're right and how much you lose when you're wrong.",
    author: "George Soros",
  },
  {
    quote:
      "Be fearful when others are greedy. Be greedy when others are fearful.",
    author: "Warren Buffett",
  },
  {
    quote: "Don’t look for the needle in the haystack. Just buy the haystack!",
    author: "John Bogle",
  },
  {
    quote:
      "The intelligent investor is a realist who sells to optimists and buys from pessimists.",
    author: "Benjamin Graham",
  },
  {
    quote: "The biggest risk of all is not taking one.",
    author: "Mellody Hobson",
  },
  {
    quote: "You miss 100% of the shots you don’t take.",
    author: "Wayne Gretzky",
  },
  {
    quote: "Know what you own, and know why you own it.",
    author: "Peter Lynch",
  },
  {
    quote: "In investing, what is comfortable is rarely profitable.",
    author: "Robert Arnott",
  },
  {
    quote: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
  },
  {
    quote:
      "Given a 10% chance of a 100 times payoff, you should take that bet every time.",
    author: "Jeff Bezos",
  },
  {
    quote:
      "I will tell you how to become rich. Close the doors. Be fearful when others are greedy. Be greedy when others are fearful.",
    author: "Warren Buffett",
  },
  {
    quote: "Don't look for the needle in the haystack. Just buy the haystack!",
    author: "John Bogle",
  },
  {
    quote:
      "I don't look to jump over seven-foot bars; I look around for one-foot bars that I can step over.",
    author: "Warren Buffett",
  },
  {
    quote: "In investing, what is comfortable is rarely profitable.",
    author: "Robert Arnott",
  },
  {
    quote:
      "The market can remain irrational longer than you can remain solvent.",
    author: "John Maynard Keynes",
  },
  {
    quote:
      "Good decisions come from experience, and experience comes from making bad decisions.",
    author: "Mark Twain",
  },
  {
    quote: "Shut up and take my money!",
    author: "Philip J. Fry",
  },
];

const FinancialQuote = () => {
  const randomIndex = Math.floor(Math.random() * financialQuotes.length);
  const randomQuote = financialQuotes[randomIndex];

  return (
    <div className="flex flex-col items-center justify-center">
      <h3 className="text-2xl font-semibold text-green-400 mb-2">
        &quot;{randomQuote.quote}&quot;
      </h3>
      <p className="text-md text-gray-400">-{randomQuote.author}</p>
    </div>
  );
};

const StartTurnUpdates = () => {
  const { currentTurn } = useGame();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="flex flex-col justify-center items-center bg-gradient-to-b from-green-800 to-black text-white p-8 rounded-lg shadow-xl w-full max-w-xl mx-auto border-2 border-green-500"
    >
      <motion.h2
        className="text-4xl font-bold tracking-wide mb-6 text-green-300"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        Turn {currentTurn.turn}
      </motion.h2>
      <motion.div
        className="text-center mb-8 text-lg leading-relaxed italic text-gray-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {currentTurn.turn == 1 ? (
          <p>
            Welcome to Sectors, it is now time to plan your first moves. Feel
            free to plan and coordinate with other players. Be truthful, be
            deceitful, be whatever you need to be to make money. There are no
            binding deals, only agreements made in good will for the greater
            economy. Good luck!
          </p>
        ) : (
          <FinancialQuote />
        )}
      </motion.div>
    </motion.div>
  );
};

export default StartTurnUpdates;
