"use client";

import { NextUIProvider } from "@nextui-org/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { PusherProvider } from "./components/Pusher.context";
import { AuthUserProvider } from "./components/AuthUser.context";
import TopBar from "./components/TopBar";
import { trpc, trpcClient } from "./trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import UserNameAlert from "./components/General/UserNameAlert";

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <NextThemesProvider attribute="class" defaultTheme="dark">
      <NextUIProvider>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <AuthUserProvider>
              <PusherProvider>
                <div className="flex flex-col h-screen text-foreground bg-background">
                  <UserNameAlert />
                  <TopBar />
                  <Toaster />
                  {children}
                </div>
              </PusherProvider>
            </AuthUserProvider>
          </QueryClientProvider>
        </trpc.Provider>
      </NextUIProvider>
    </NextThemesProvider>
  );
};

export default ClientLayout;
