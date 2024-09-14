"use client";

import { useAuthUser } from "../AuthUser.context";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../shadcn/AlertDialog";
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

const UserNameAlert = () => {
  const { user } = useAuthUser();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  // If the user is not 'anon', there is no user, or the user is on '/accounts/settings', do not render the alert.
  if (!user || user.name !== "anon" || pathname === "/account/settings") {
    return null;
  }

  const handleContinue = () => {
    // Close the dialog and redirect to /accounts/settings
    setOpen(false);
    router.push('/account/settings');
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Welcome Anon, Please Make a Name for Yourself</AlertDialogTitle>
          <AlertDialogDescription>
            Every investor needs a name. Please go to your settings to set up your profile.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Dismiss</AlertDialogCancel>
          <AlertDialogAction onClick={handleContinue}>
            Go to Settings
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UserNameAlert;
