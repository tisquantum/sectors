import MeetingInput from "./MeetingInput";
import MeetingMessages from "./MeetingMessages";

export const Meeting = () => {
  return (
    <div className="w-full">
      <MeetingMessages />
      <MeetingInput />
    </div>
  );
};

export default Meeting;
