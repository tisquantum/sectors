"use client";

import { createClient } from "@sectors/utils/supabase/client";
import { User } from "@server/prisma/prisma.client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { createContext, useContext, useState, useEffect } from "react";
import { trpc } from "../trpc";

interface AuthUserContextProps {
  supabaseUser: SupabaseUser | null;
  user: User | null;
  loading: boolean;
}
const supabase = createClient();
const AuthUserContext = createContext<AuthUserContextProps>({
    supabaseUser: null,
    user: null,
    loading: true,
});

export const AuthUserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const { data: user, isLoading: userLoading } = trpc.user.getUser.useQuery(
    { id: supabaseUser?.id ?? '' },
    { enabled: !!supabaseUser }
  );
  const loading = userLoading;

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
      } else {
        setSupabaseUser(user);
      }
    };
    // Initial fetch
    fetchUser();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setSupabaseUser(currentUser);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthUserContext.Provider value={{ supabaseUser, user: user ?? null, loading }}>
      {children}
    </AuthUserContext.Provider>
  );
};

export const useAuthUser = () =>  useContext(AuthUserContext);
