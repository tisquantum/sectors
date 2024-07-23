import { useEffect, useState } from "react";
import * as PusherTypes from "pusher-js";
import { getGameChannelId } from "@server/pusher/pusher.types";
import { usePusher } from "../components/Pusher.context";

export const usePusherSubscription = (gameId: string) => {
  const [channel, setChannel] = useState<PusherTypes.Channel | null>(null);
  const { pusher } = usePusher();
  useEffect(() => {
    if (!pusher || !gameId) {
      return;
    }

    const newChannel = pusher.subscribe(getGameChannelId(gameId));
    setChannel(newChannel);

    return () => {
      newChannel.unsubscribe();
    };
  }, [gameId, pusher]);

  return channel;
};
