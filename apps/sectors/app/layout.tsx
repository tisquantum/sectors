import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NextUIProvider } from "@nextui-org/react";
import { PusherProvider } from "./components/Pusher.context";

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
          <PusherProvider>{children}</PusherProvider>
        </NextUIProvider>
      </body>
    </html>
  );
}
