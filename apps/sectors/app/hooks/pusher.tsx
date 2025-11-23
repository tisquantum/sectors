import { useEffect, useState } from "react";
import * as PusherTypes from "pusher-js";
import { getGameChannelId } from "@server/pusher/pusher.types";
import { usePusher } from "../components/Pusher.context";

const subscriptionCountRef = new Map<string, number>();

export const usePusherSubscription = (gameId: string) => {
  const [channel, setChannel] = useState<PusherTypes.Channel | null>(null);
  const { pusher } = usePusher();
  
  useEffect(() => {
    if (!pusher || !gameId) {
      return;
    }

    const channelName = getGameChannelId(gameId);
    const count = (subscriptionCountRef.get(channelName) || 0) + 1;
    subscriptionCountRef.set(channelName, count);
    
    if (count > 1) {
      console.warn(`[usePusherSubscription] Subscribing to ${channelName} for the ${count}th time!`);
    } else {
      console.log(`[usePusherSubscription] Subscribing to ${channelName}`);
    }
    
    if (count > 10) {
      console.error(`[usePusherSubscription] POTENTIAL MEMORY LEAK: Subscribed to ${channelName} ${count} times!`);
    }

    const newChannel = pusher.subscribe(channelName);
    setChannel(newChannel);

    return () => {
      const unsubscribeCount = subscriptionCountRef.get(channelName) || 0;
      subscriptionCountRef.set(channelName, Math.max(0, unsubscribeCount - 1));
      console.log(`[usePusherSubscription] Unsubscribing from ${channelName} (remaining: ${unsubscribeCount - 1})`);
      pusher.unsubscribe(channelName);
      setChannel(null);
    };
  }, [gameId, pusher]);

  return channel;
};
