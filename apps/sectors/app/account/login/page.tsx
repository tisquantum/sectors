"use client";
import { useState } from "react";
import { login, googleSignIn, anonymousSignIn } from "./actions";
import DebounceButton from "@sectors/app/components/General/DebounceButton";
import { Turnstile } from "@marsidev/react-turnstile";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("captchaToken", captchaToken);
    await login(formData);
    setIsSubmitting(false);
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      await googleSignIn();
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  const handleAnonymousLogin = async () => {
    try {
      await anonymousSignIn(captchaToken);
    } catch (error) {
      console.error("Anonymous Sign-In Error:", error);
    }
  };

  const isFormValid = email && password && !emailError;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-500">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md">
        <h3 className="text-lg text-black font-bold mb-6 text-center">Login</h3>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-800 text-sm font-bold mb-2"
            >
              Email:
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:shadow-outline"
            />
            {emailError && (
              <p className="text-red-500 text-xs italic mt-2">{emailError}</p>
            )}
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-gray-800 text-sm font-bold mb-2"
            >
              Password:
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="flex items-center justify-center mb-4">
            <DebounceButton
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              isDisabled={isSubmitting || !isFormValid}
              isLoading={isLoading}
            >
              {isSubmitting ? "Logging in..." : "Log in"}
            </DebounceButton>
          </div>
          <div className="text-center mt-4">
            <a
              className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
              href="/account/forgot-password"
            >
              Forgot Password?
            </a>
            <br />
            <a
              className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800 mt-2"
              href="/account/sign-up"
            >
              Don&apos;t have an account? Sign up
            </a>
          </div>
        </form>

        {/* OR Divider */}
        <div className="flex items-center my-6">
          <div className="w-full border-t border-gray-300"></div>
          <div className="text-gray-500 px-3">OR</div>
          <div className="w-full border-t border-gray-300"></div>
        </div>

        {/* Google Sign-In Button */}
        <div className="text-center">
          <button
            onClick={handleGoogleLogin}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            Sign in with Google
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Sign in using your Google account. If this is your first time using
            this app, a sectors account will be created for you.
          </p>
        </div>

        <div className="text-center mt-3">
          <button
            onClick={handleAnonymousLogin}
            className="bg-gray-600 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            Continue as Guest
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Continue as a guest to play sectors. You will lose access to this
            guest account if you sign out or clear browsing data. This account
            is only accessible from this browser on this device.
          </p>
        </div>
        <div className="flex justify-center items-center text-center mt-3">
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
            onSuccess={(token) => {
              setCaptchaToken(token);
            }}
          />
        </div>
      </div>
    </div>
  );
}
