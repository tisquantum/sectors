"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Pusher from "pusher-js";

interface PusherContextProps {
  pusher: Pusher | null;
}

const PusherContext = createContext<PusherContextProps>({ pusher: null });

export const usePusher = () => useContext(PusherContext);

export const PusherProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pusher, setPusher] = useState<Pusher | null>(null);

  useEffect(() => {
    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!
    });

    pusherClient.connection.bind("error", function (err: any) {
      if (err.data.code === 4004) {
        console.error("Over limit!");
      }
    });

    setPusher(pusherClient);

    return () => {
      pusherClient.disconnect();
    };
  }, []);

  return (
    <PusherContext.Provider value={{ pusher }}>
      {children}
    </PusherContext.Provider>
  );
};
