import MeetingInput from "./MeetingInput";
import MeetingMessages from "./MeetingMessages";

export const Meeting = () => {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="basis-3/4 flex justify-center content-center overflow-y-auto scrollbar">
        <MeetingMessages />
      </div>
      <div className="basis-1/4">
      <MeetingInput />
      </div>
    </div>
  );
};

export default Meeting;
