import GlobalChat from "../components/Game/GlobalChat";
import RoomBrowser from "../components/Room/RoomBrowser";

export default function RoomBrowserPage() {
  return (
    <div className="flex flex-row bg-black">
      <div className="basis-1/4">
        <GlobalChat />
      </div>
      <RoomBrowser />
    </div>
  );
}
