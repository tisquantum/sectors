import { useEffect, useState } from "react";
import {
  EVENT_NEW_PHASE,
  EVENT_NEW_PLAYER_ORDER_PLAYER_ID,
  getGameChannelId,
} from "@server/pusher/pusher.types";
import { Phase } from "@server/prisma/prisma.client";
import { trpc } from "@sectors/app/trpc";
import { usePusher } from "../components/Pusher.context";
import { GameState } from "@server/prisma/prisma.types";
import * as PusherTypes from "pusher-js";

export const usePusherSubscription = (gameId: string) => {
  const { pusher } = usePusher();
  const utils = trpc.useUtils();
  const [channel, setChannel] = useState<PusherTypes.Channel | null>(null);

  useEffect(() => {
    if (!pusher || !gameId) {
      console.log("early return pusher subscription");
      return;
    }

    console.log("Subscribing to game channel");
    const newChannel = pusher.subscribe(getGameChannelId(gameId));
    setChannel(newChannel);

    const handleNewPhase = (data: { game: GameState; phase: Phase }) => {
      console.log("New Phase:", data);
      utils.game.getGameState.setData({ gameId }, () => data.game);
    };

    newChannel.bind(EVENT_NEW_PHASE, handleNewPhase);

    return () => {
      console.log("Unsubscribing from game channel");
      newChannel.unbind(EVENT_NEW_PHASE, handleNewPhase);
      newChannel.unsubscribe();
    };
  }, [gameId, pusher, utils]);

  return channel;
};
