"use client";

import { Input } from "@nextui-org/react";
import DebounceButton from "./DebounceButton";
import { useGame } from "../Game/GameContext";
import { useAuthUser } from "../AuthUser.context";
import { useEffect, useState } from "react";
import { trpc } from "@sectors/app/trpc";

const UpdateName = () => {
  const { user, loading, refetchUser } = useAuthUser();
  const [name, setName] = useState<string>(user?.name ?? "");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const useUpdateUserNameMutation = trpc.user.updateUserName.useMutation({
    onSuccess: () => {
      refetchUser();
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });
  if (!user) return null;
  const handleUpdateName = async () => {
    setIsLoading(true);
    await useUpdateUserNameMutation.mutate({ id: user.id, name });
    setIsSubmitted(true);
  };
  return (
    <div>
      <h2 className="text-md">Update Name</h2>
      <div className="flex flex-col gap-2">
        <Input
          type="text"
          placeholder="New Name"
          onChange={(e) => setName(e.target.value)}
          value={name}
        />
        <DebounceButton onClick={handleUpdateName} isLoading={isLoading}>
          Update
        </DebounceButton>
        {isSubmitted && <div>Name has been updated.</div>}
      </div>
    </div>
  );
};
export default UpdateName;
