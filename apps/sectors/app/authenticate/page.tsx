"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "../components/AuthUser.context";

export default function Authenticate() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { fetchUser, supabaseUser } = useAuthUser();

  useEffect(() => {
    const authenticateUser = async () => {
      setLoading(true); // Start loading

      fetchUser().then(() => {
        if (supabaseUser) {
          // User is authenticated, redirect to /rooms
          router.replace("/rooms");
        } else {
          // No user found, redirect to login
          router.replace("/login");
        }

        setLoading(false); // Stop loading
      });
    };
    authenticateUser();
  }, [fetchUser, supabaseUser, router]);

  if (loading) {
    // Show a loading indicator while checking the auth status
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  }

  // This point should never be reached since the component will redirect before rendering this part
  return null;
}
