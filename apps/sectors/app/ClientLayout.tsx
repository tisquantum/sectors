"use client";

import { NextUIProvider, Button } from "@nextui-org/react";
import { PusherProvider } from "./components/Pusher.context";
import { AuthUserProvider } from "./components/AuthUser.context";
import TopBar from "./components/TopBar";
import { trpc, trpcClient } from "./trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import UserNameAlert from "./components/General/UserNameAlert";
import ThemeProvider from "./components/ThemeProvider.context";
import { RiCloseLine, RiMenu3Line } from "@remixicon/react";

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());
  const [isTopBarOpen, setIsTopBarOpen] = useState(false);

  useEffect(() => {
    if (!isTopBarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsTopBarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isTopBarOpen]);

  return (
    <NextUIProvider>
      <ThemeProvider>
        <main className="dark text-foreground bg-background h-[100vh] min-h-0 overflow-hidden">
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <AuthUserProvider>
                <PusherProvider>
                  <div className="flex flex-col text-foreground bg-background h-[100vh] min-h-0 overflow-hidden relative">
                    <UserNameAlert />
                    <Toaster duration={10000} />
                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                      {children}
                    </div>
                    {isTopBarOpen && (
                      <>
                        <button
                          type="button"
                          className="fixed inset-0 z-[9998] bg-black/55"
                          aria-label="Close site navigation"
                          onClick={() => setIsTopBarOpen(false)}
                        />
                        <div className="fixed top-0 left-0 right-0 z-[9999] shadow-2xl">
                          <TopBar isOverlay />
                        </div>
                      </>
                    )}
                    <Button
                      isIconOnly
                      radius="full"
                      variant="flat"
                      className="fixed top-2 right-2 z-[10000] h-10 w-10 min-w-10 bg-zinc-800/95 text-zinc-100 border border-zinc-600 shadow-lg backdrop-blur-sm"
                      aria-label={
                        isTopBarOpen
                          ? "Close site navigation"
                          : "Open site navigation (Rooms, account, links)"
                      }
                      aria-expanded={isTopBarOpen}
                      onPress={() => setIsTopBarOpen((open) => !open)}
                    >
                      {isTopBarOpen ? (
                        <RiCloseLine size={22} />
                      ) : (
                        <RiMenu3Line size={22} />
                      )}
                    </Button>
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
