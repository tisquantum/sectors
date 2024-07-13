import { Input } from "@nextui-org/react";
import { trpc } from "@sectors/app/trpc";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthUser } from "../AuthUser.context";
import Button from "@sectors/app/components/General/DebounceButton";

const CreateRoom = () => {
  const router = useRouter();
  const { user } = useAuthUser();
  const [roomName, setRoomName] = useState<string | undefined>(undefined);
  const createRoomMutation = trpc.room.createRoom.useMutation();
  const joinRoomMutation = trpc.roomUser.joinRoom.useMutation();
  const handleCreateRoom = () => {
    if (!roomName) return;
    createRoomMutation.mutate(
      { name: roomName },
      {
        onSuccess: async (data) => {
          if(user == undefined) return;
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

  return (
    <div className="flex flex-col max-w-56">
      <Input
        placeholder="Room Name"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
      />
      <Button onClick={handleCreateRoom} disabled={!roomName}>
        Create Room
      </Button>
    </div>
  );
};

export default CreateRoom;
