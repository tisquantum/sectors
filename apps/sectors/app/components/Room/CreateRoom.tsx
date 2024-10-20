import { Input } from "@nextui-org/react";
import { trpc } from "@sectors/app/trpc";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuthUser } from "../AuthUser.context";
import Button from "@sectors/app/components/General/DebounceButton";
import DebounceButton from "@sectors/app/components/General/DebounceButton";
import { ROOM_NAME_CHAR_LIMIT } from "@server/data/constants";

const CreateRoom = () => {
  const router = useRouter();
  const { user } = useAuthUser();
  const [roomName, setRoomName] = useState<string | undefined>(undefined);
  const createRoomMutation = trpc.room.createRoom.useMutation();
  const joinRoomMutation = trpc.roomUser.joinRoom.useMutation();
  const [createRoomIsLoading, setCreateRoomIsLoading] = useState(false);
  const handleCreateRoom = () => {
    if (!roomName) return;
    setCreateRoomIsLoading(true);
    createRoomMutation.mutate(
      { name: roomName },
      {
        onSuccess: async (data) => {
          if (user == undefined) return;
          await joinRoomMutation.mutate({
            roomId: data.id,
            userId: user.id,
            roomHost: true,
          });
          router.push(`/rooms/${data.id}`);
        },
        onError: (error) => {
          // Handle the error appropriately
          console.error("Error creating room:", error);
        },
      }
    );
  };

  const isInvalid = useMemo(() => {
    return roomName ? roomName.length > ROOM_NAME_CHAR_LIMIT : undefined;
  }, [roomName]);

  return (
    <div className="flex flex-col max-w-56">
      <Input
        placeholder="Room Name"
        value={roomName}
        isInvalid={isInvalid}
        errorMessage={`Room name must be less than ${ROOM_NAME_CHAR_LIMIT} characters`}
        onChange={(e) => setRoomName(e.target.value)}
      />
      <DebounceButton
        onClick={handleCreateRoom}
        isLoading={createRoomIsLoading}
        isDisabled={isInvalid || roomName?.length == 0 || !roomName}
      >
        Create Room
      </DebounceButton>
    </div>
  );
};

export default CreateRoom;
