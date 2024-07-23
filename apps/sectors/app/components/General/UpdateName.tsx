"use client";

import { Input } from "@nextui-org/react";
import DebounceButton from "./DebounceButton";
import { useGame } from "../Game/GameContext";
import { useAuthUser } from "../AuthUser.context";
import { useEffect, useState } from "react";
import { trpc } from "@sectors/app/trpc";

const UpdateName = () => {
  const { user, loading } = useAuthUser();
  const [name, setName] = useState<string>(user?.name ?? "");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const useUpdateUserNameMutation = trpc.user.updateUserName.useMutation();
  if (!user) return null;
  const handleUpdateName = () => {
    useUpdateUserNameMutation.mutate({ id: user.id, name });
    setIsSubmitted(true);
  };
  return (
    <div>
      <h2 className="text-md">Update Name {user.name}</h2>
      <div className="flex flex-col gap-2">
        <Input
          type="text"
          placeholder="New Name"
          onChange={(e) => setName(e.target.value)}
          value={name}
        />
        {isSubmitted ? (
          <div>Name has been updated.</div>
        ) : (
          <DebounceButton onClick={handleUpdateName}>Update</DebounceButton>
        )}
      </div>
    </div>
  );
};
export default UpdateName;
