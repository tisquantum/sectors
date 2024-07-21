"use client";

import PlayersOverview from "../Player/PlayersOverview";
import { Accordion, Card, CardBody, Tab, Tabs } from "@nextui-org/react";
import SectorComponent from "../Sector/Sector";
import GameLog from "./GameLog";

const TabView = ({ gameId }: { gameId: string }) => {
  return (
    <Tabs aria-label="Options" isVertical>
      <Tab key="players" title="Players">
        <Card>
          <PlayersOverview gameId={gameId} />
        </Card>
      </Tab>
      <Tab key="sectors" title="Sectors">
        <Card>
          <SectorComponent />
        </Card>
      </Tab>
      <Tab key="game-log" title="GameLog">
        <Card>
          <GameLog />
        </Card>
      </Tab>
      <Tab key="close" title="Close"></Tab>
    </Tabs>
  );
};

export default TabView;
