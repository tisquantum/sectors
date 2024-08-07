import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";
import { usePusher } from "../Pusher.context";
import { useEffect } from "react";
import {
  EVENT_MEETING_MESSAGE_CREATED,
  getGameChannelId,
} from "@server/pusher/pusher.types";
import { MeetingMessage } from "@server/prisma/prisma.client";
import { Avatar } from "@nextui-org/react";
import { MeetingMessageWithPlayer } from "@server/prisma/prisma.types";
import { motion } from "framer-motion";
import PlayerAvatar from "../Player/PlayerAvatar";

const MeetingMessages = () => {
  const { gameId, socketChannel: channel } = useGame();
  const utils = trpc.useUtils();
  const {
    data: meetingMessages,
    isLoading,
    isError,
  } = trpc.meetingMessage.listMessages.useQuery({ where: { gameId } });
  useEffect(() => {
    if (!channel) return;

    channel.bind(
      EVENT_MEETING_MESSAGE_CREATED,
      (data: MeetingMessageWithPlayer) => {
        utils.meetingMessage.listMessages.setData(
          { where: { gameId: gameId } },
          (oldData: MeetingMessageWithPlayer[] | undefined) => [
            ...(oldData || []),
            data,
          ]
        );
      }
    );

    return () => {
      channel.unbind(EVENT_MEETING_MESSAGE_CREATED);
    };
  }, [channel, isLoading]);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error...</div>;
  if (meetingMessages == undefined) return null;

  return (
    <div className="flex flex-wrap gap-3 items-center justify-center content-center">
      {meetingMessages.map((message) => (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex gap-3 w-64 justify-center items-center content-center p-2"
          key={message.id}
        >
          <PlayerAvatar player={message.player} />
          <span>{message.content}</span>
        </motion.div>
      ))}
    </div>
  );
};

export default MeetingMessages;
