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
import ThemeProvider from "./components/ThemeProvider.context";

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <NextUIProvider>
      <ThemeProvider>
        <main className="dark text-foreground bg-background h-[100vh]">
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <AuthUserProvider>
                <PusherProvider>
                  <div className="flex flex-col text-foreground bg-background h-[100vh]">
                    <UserNameAlert />
                    <TopBar />
                    <Toaster duration={10000} />
                    {children}
                  </div>
                </PusherProvider>
              </AuthUserProvider>
            </QueryClientProvider>
          </trpc.Provider>
        </main>
      </ThemeProvider>
    </NextUIProvider>
  );
};

export default ClientLayout;
