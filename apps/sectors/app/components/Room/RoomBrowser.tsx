"use client";

import { trpc } from "@sectors/app/trpc";
import { Suspense, useEffect, useState } from "react";
import RoomListItem from "./RoomList";
import { notFound, useSearchParams } from "next/navigation";
import CreateRoom from "./CreateRoom";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { useAuthUser } from "../AuthUser.context";
import {
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Switch,
  useDisclosure,
  Button,
} from "@nextui-org/react";
import { GameStatus } from "@server/prisma/prisma.client";
import { renderGameStatusColor } from "@sectors/app/helpers";
import { RiCheckboxCircleFill, RiCloseCircleFill } from "@remixicon/react";
import { RoomWithUsersAndGames } from "@server/prisma/prisma.types";
import { TRPCClientErrorLike } from "@trpc/client";
import { DefaultErrorShape } from "@trpc/server/unstable-core-do-not-import";

export default function RoomBrowser() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { user } = useAuthUser();
  const {
    data: rooms,
    isLoading,
    error,
    refetch,
  } = trpc.room.listRooms.useQuery({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<GameStatus | null>(
    GameStatus.PENDING
  );
  const [yourRoomsOnly, setYourRoomsOnly] = useState(false);

  return (
    <Suspense fallback={<div>Loading search parameters...</div>}>
      <RoomBrowserContent
        rooms={rooms}
        isLoading={isLoading}
        error={error}
        refetch={refetch}
        user={user}
        isOpen={isOpen}
        onOpen={onOpen}
        onOpenChange={onOpenChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        yourRoomsOnly={yourRoomsOnly}
        setYourRoomsOnly={setYourRoomsOnly}
      />
    </Suspense>
  );
}

function RoomBrowserContent({
  rooms,
  isLoading,
  error,
  refetch,
  user,
  isOpen,
  onOpen,
  onOpenChange,
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  yourRoomsOnly,
  setYourRoomsOnly,
}: {
  rooms: RoomWithUsersAndGames[] | undefined;
  isLoading: boolean;
  error: TRPCClientErrorLike<{
    input: {
      skip?: number | undefined;
      take?: number | undefined;
      cursor?: number | undefined;
      where?: any;
      orderBy?: any;
    };
    output: RoomWithUsersAndGames[];
    transformer: true;
    errorShape: DefaultErrorShape;
  }> | null;
  refetch: any;
  user: any;
  isOpen: boolean;
  onOpen: any;
  onOpenChange: any;
  searchQuery: string;
  setSearchQuery: any;
  selectedStatus: GameStatus | null;
  setSelectedStatus: any;
  yourRoomsOnly: boolean;
  setYourRoomsOnly: any;
}) {
  const searchParams = useSearchParams();
  const isKicked = searchParams.get("kicked") === "true";

  useEffect(() => {
    if (isKicked) {
      onOpen(); // Open the modal if kicked
    }
  }, [isKicked, onOpen]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!rooms) return notFound();

  const handleRefresh = () => refetch();
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchQuery(e.target.value);
  const handleClearSearch = () => setSearchQuery("");
  const handleChipClick = (status: GameStatus) => setSelectedStatus(status);
  const handleYourRoomsClick = () => setYourRoomsOnly(!yourRoomsOnly);

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const gameStatus = room.game?.[0]?.gameStatus || "PENDING";
    const matchesStatus = selectedStatus ? gameStatus === selectedStatus : true;
    const matchesUser = yourRoomsOnly
      ? room.users.some((roomUser) => roomUser.user.id === user?.id)
      : true;
    return matchesSearch && matchesStatus && matchesUser;
  });

  return (
    <div className="container mx-auto p-1 bg-background">
      <div className="flex items-center justify-between my-4">
        <h1 className="text-2xl font-bold">Rooms</h1>
        <Button color="primary" onClick={handleRefresh}>
          <ArrowPathIcon className="size-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.values(GameStatus).map((status, index) => (
          <Chip
            key={index}
            className="cursor-pointer"
            startContent={selectedStatus === status && <RiCheckboxCircleFill />}
            color={renderGameStatusColor(status)}
            onClick={() => handleChipClick(status)}
          >
            {status}
          </Chip>
        ))}
        <div className="flex items-center gap-2">
          <Switch
            isSelected={yourRoomsOnly}
            onValueChange={handleYourRoomsClick}
          >
            Your Rooms
          </Switch>
        </div>
      </div>
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Search rooms..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full p-2 border border-gray-300 rounded text-slate-900"
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-2 inset-y-0 m-auto text-gray-500 hover:text-gray-700"
          >
            <RiCloseCircleFill />
          </button>
        )}
      </div>
      <div className="grid grid-flow-row auto-rows-max">
        {filteredRooms.map((room) => (
          <RoomListItem room={room} key={room.id} />
        ))}
      </div>
      {user && <CreateRoom />}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Notice</ModalHeader>
              <ModalBody>
                <p>You have been kicked from the room.</p>
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
    </div>
  );
}
