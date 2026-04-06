"use client";
import { useState } from "react";
import GlobalChat from "../components/Game/GlobalChat";
import RoomBrowser from "../components/Room/RoomBrowser";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@nextui-org/react";

export default function RoomBrowserPage() {
  // Optional: Chat Toggle Logic for Mobile
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  return (
    <div className="flex flex-col lg:flex-row bg-black h-full min-h-0">
      {/* GlobalChat: Hidden on small screens, sidebar on larger screens */}
      <div className="hidden lg:block basis-1/4 h-full min-h-0 overflow-y-auto">
        <GlobalChat classes={"top-0 left-0 h-full w-full"} />
      </div>

      {/* RoomBrowser: Full width on mobile, partial width on larger screens */}
      <div className="flex-1 h-full overflow-y-scroll">
        <RoomBrowser />
      </div>

      {/* GlobalChat: Shown as a button on mobile */}
      <div className="fixed bottom-4 right-4 lg:hidden">
        <Button
          className="bg-blue-500 text-white p-3 rounded-full shadow-lg"
          onPress={() => onOpen()}
        >
          Chat
        </Button>
      </div>
      <Modal className="h-full" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalBody className="h-full">
            <GlobalChat classes={"h-full w-full"} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
