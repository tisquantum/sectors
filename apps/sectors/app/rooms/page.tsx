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
    <div className="flex flex-col md:flex-row bg-black h-screen">
      {/* GlobalChat: Hidden on small screens, sidebar on larger screens */}
      <div className="hidden md:block basis-1/4 h-full overflow-y-auto">
        <GlobalChat classes={"top-[60px] left-0 h-[calc(100vh-65px)] w-full"} />
      </div>

      {/* RoomBrowser: Full width on mobile, partial width on larger screens */}
      <div className="flex-1 h-full overflow-y-scroll">
        <RoomBrowser />
      </div>

      {/* GlobalChat: Shown as a button on mobile */}
      <div className="fixed bottom-4 right-4 md:hidden">
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
