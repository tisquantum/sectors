import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";

const MeetingMessages = () => {
  const { gameId } = useGame();
  const {
    data: meetingMessages,
    isLoading,
    isError,
  } = trpc.meetingMessage.listMessages.useQuery({ where: { gameId } });
  
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error...</div>;
  if(meetingMessages == undefined) return null;
  return (
    <div>
      {meetingMessages.map((message) => (
        <div key={message.id}>
          {message.content}
        </div>
      ))}
    </div>
  );
};

export default MeetingMessages;
