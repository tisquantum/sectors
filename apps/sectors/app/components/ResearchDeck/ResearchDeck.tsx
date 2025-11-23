import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@nextui-org/react";
import { Card } from "@server/prisma/prisma.client";
import { useGame } from "../Game/GameContext";
import { motion } from "framer-motion";
import {
  baseToolTipStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";
import { friendlyResearchName } from "@sectors/app/helpers";
import { RiInformationFill } from "@remixicon/react";

const ResearchDeck = () => {
  //TODO: Add descript state for companies
  const { researchDeck, gameState } = useGame();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const cardsGroupedByCompany = researchDeck.cards.reduce((acc, card) => {
    if (!card.companyId) {
      return acc;
    }
    if (!acc[card.companyId]) {
      acc[card.companyId] = [];
    }
    acc[card.companyId].push(card);
    return acc;
  }, {} as Record<string, Card[]>);
  if (!gameState) return null;
  const companies = gameState.Company;
  if (!companies) return null;
  return (
    <div className="p-4">
      <div className="mb-4">
        <Button onPress={onOpen}>Show Deck</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(cardsGroupedByCompany).map(([companyId, cards]) => (
          <motion.div
            key={companyId}
            className="bg-gray-800 p-4 rounded-lg shadow-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCompany(companyId)}
          >
            <h2 className="text-base lg:text-lg font-semibold mb-2">
              {companies.find((company) => company.id === companyId)?.name ||
                "Company"}
            </h2>
            <div className="flex flex-wrap gap-1">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="flex gap-1 items-center text-sm lg:text-base p-2 bg-gray-700 rounded-md text-white"
                >
                  {friendlyResearchName(card.effect)}
                  <Popover>
                    <PopoverTrigger>
                      <Button isIconOnly>
                        <RiInformationFill size={18} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <div className="flex p-2 max-w-[200px]">
                        <p>{card.description}</p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <Modal
        size="4xl"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="dark bg-slate-900 text-foreground"
      >
        <ModalContent className="h-full overflow-y-auto">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Research Deck
              </ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {researchDeck.cards.map((card) => (
                    <div
                      key={card.id}
                      className="p-4 bg-gray-700 rounded-md text-white"
                    >
                      <h3 className="text-base lg:text-lg">
                        {friendlyResearchName(card.effect)}
                      </h3>
                      <p>{card.description}</p>
                    </div>
                  ))}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {selectedCompany && (
        <Modal
          isOpen={Boolean(selectedCompany)}
          onOpenChange={() => setSelectedCompany(null)}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {companies.find((company) => company.id == selectedCompany)
                    ?.name || "Company"}{" "}
                  Cards
                </ModalHeader>
                <ModalBody>
                  <div className="flex flex-wrap gap-4">
                    {cardsGroupedByCompany[selectedCompany]?.map((card) => (
                      <div
                        key={card.id}
                        className="p-4 bg-gray-700 rounded-md text-white"
                      >
                        <h3 className="text-lg">{card.name}</h3>
                        <p>{card.description}</p>
                      </div>
                    ))}
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Close
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default ResearchDeck;
