"use client";

import { Input } from "@nextui-org/react";
import DebounceButton from "./DebounceButton";
import { useAuthUser } from "../AuthUser.context";
import { useEffect, useState } from "react";
import { trpc } from "@sectors/app/trpc";

const UpdateName = () => {
  const { user, loading: userLoading, refetchUser } = useAuthUser();
  const [name, setName] = useState<string>(user?.name ?? "");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const useUpdateUserNameMutation = trpc.user.updateUserName.useMutation({
    onSuccess: () => {
      refetchUser();
      setIsSubmitted(true);
      setErrorMessage(undefined); // Clear any previous error messages
    },
    onSettled: () => {
      setIsLoading(false);
    },
    onError: (error) => {
      setErrorMessage(error.message);
    },
  });

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  if (!user || userLoading) return null;

  const handleUpdateName = async () => {
    setIsLoading(true);
    setIsSubmitted(false); // Reset submission state
    setErrorMessage(undefined); // Clear previous error messages
    await useUpdateUserNameMutation.mutate({ id: user.id, name });
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
        {isSubmitted && <div className="text-green-500">Name has been updated.</div>}
        {errorMessage && <div className="text-red-500">{errorMessage}</div>}
      </div>
    </div>
  );
};

export default UpdateName;
