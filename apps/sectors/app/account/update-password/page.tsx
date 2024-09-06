"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@sectors/utils/supabase/client";
import DebounceButton from "@sectors/app/components/General/DebounceButton";
import { Input } from "@nextui-org/react";
import { set } from "lodash";

const ResetPasswordPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const resetToken = searchParams.get("token");

  const handleSubmit = async () => {
    setIsLoading(true);
    if (!resetToken) {
      console.error("No reset token found.");
      return;
    }

    try {
      // Step 4: Update the user's password using the reset token and new password
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setMessage("Error updating password");
      } else {
        setMessage("Password updated successfully");
        // Optionally redirect to login page or show a success message
        router.push("/login");
      }
    } catch (error) {
      setMessage("Unexpected error");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Reset Password</h1>
        <div className="flex flex-col gap-4">
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full"
          />
          <DebounceButton
            onClick={handleSubmit}
            className="w-full"
            isLoading={isLoading}
          >
            Update Password
          </DebounceButton>
        </div>
        {message && (
          <p className="text-center text-sm text-green-600 mt-4">{message}</p>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
