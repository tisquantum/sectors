import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NextUIProvider } from "@nextui-org/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { PusherProvider } from "./components/Pusher.context";
import { AuthUserProvider } from "./components/AuthUser.context";
import TopBar from "./components/TopBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sectors",
  description: "Make Money Or Lose",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextUIProvider>
          <NextThemesProvider attribute="class" defaultTheme="dark">
            <AuthUserProvider>
              <PusherProvider>
                <div className="flex flex-col h-screen text-foreground bg-background">
                  <TopBar />
                  {children}
                </div>
              </PusherProvider>
            </AuthUserProvider>
          </NextThemesProvider>
        </NextUIProvider>
      </body>
    </html>
  );
}
