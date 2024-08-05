import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@nextui-org/react";
import { useGame } from "./GameContext";
import { RiWalletFill } from "@remixicon/react";
import { MoneyTransactionHistoryByPlayer } from "./MoneyTransactionHistory";
import { Player } from "@server/prisma/prisma.client";
import PlayerAvatar from "../Player/PlayerAvatar";

const WalletInfo = ({ player }: { player: Player }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  return (
    <>
      <div className="flex gap-1 items-center cursor-pointer" onClick={onOpen}>
        <RiWalletFill size={18} /> ${player.cashOnHand}
      </div>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} className="h-full">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex flex-col gap-2 justify-center text-center">
                  <PlayerAvatar player={player} size="lg" />
                  <div>{player.nickname} Transaction History</div>
                </div>
              </ModalHeader>
              <ModalBody className="overflow-auto">
                <MoneyTransactionHistoryByPlayer player={player} />
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
    </>
  );
};

export default WalletInfo;
