import ReadyUp from "../Player/PlayerReadyUp";
import GameSidebar from "./GameSidebar";
import GameTopBar from "./GameTopBar";
import StockRoundOrderGrid from "./StockRoundOrderGrid";
import TabView, { companies } from "./TabView";

const Game = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <GameSidebar />
      <div>
        <GameTopBar />
        <TabView />
        <ReadyUp />
        <div className="active-panel">
            <StockRoundOrderGrid companies={companies} />
        </div>
      </div>
    </div>
  );
};

export default Game;
