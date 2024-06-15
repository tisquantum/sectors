import React, { ReactNode } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@nextui-org/react";
import Timer from "../Game/Timer";
interface CountdownModalProps {
  title: string;
  countdownTime: number;
  children?: ReactNode;
  actions?: ReactNode[];
  countdownCallback: () => void;
  isOpen: boolean;
}
const CountdownModal: React.FC<CountdownModalProps> = ({
  title,
  countdownTime,
  children,
  actions,
  countdownCallback,
  isOpen
}) => {
  console.log("CountdownModal isOpen", isOpen);
  return (
    <Modal
      backdrop="opaque"
      isOpen={isOpen}
      classNames={{
        backdrop:
          "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
            <ModalBody>{children}</ModalBody>
            <ModalFooter>
              <Timer countdownTime={countdownTime} onEnd={countdownCallback} />
              {actions &&
                actions.map((action, index) => <div key={index}>{action}</div>)}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default CountdownModal;
