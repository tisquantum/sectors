"use client";

import { Button, Input } from "@nextui-org/react";
import { createClient } from "@sectors/utils/supabase/client";
import { useState } from "react";
import DebounceButton from "../../components/General/DebounceButton";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const handleForgotPassword = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      console.error("Error sending reset email:", error.message);
      setMessage("Error sending reset email");
    } else {
      setMessage("Check your email for the password reset link!");
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Forgot Password</h1>
        <div className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
          <DebounceButton
            onClick={handleForgotPassword}
            className="w-full"
            isLoading={isLoading}
          >
            Send Reset Link
          </DebounceButton>
        </div>
        {message && (
          <p className="text-center text-sm text-green-600 mt-4">{message}</p>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
