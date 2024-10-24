import GlobalChat from "./components/Game/GlobalChat";

export default async function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-row gap-2">
        <div className="shadow-md rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-4 text-center">Sectors</h1>
          <p className="text-lg mb-4">
            <span className="font-bold">Sectors</span> is a game of stocks and
            running companies. You play as an influential investor trying to
            make the most money through clever investments and company
            management. The winner of the game is the player with the greatest
            net worth at the end of the game.
          </p>
          <div className="mb-4">
            <p>
              To see the dedicated rules page, please visit{" "}
              <a
                href="https://rules.sectors.gg"
                className="text-blue-500 underline"
              >
                here
              </a>
              .
            </p>
          </div>
          <div className="mb-4">
            <p>
              To start or join a game, you must create an account or log in if
              you already have one. Click{" "}
              <a href="/account/login" className="text-blue-500 underline">
                here
              </a>{" "}
              to do so.
            </p>
          </div>
          <div>
            <p>
              To join a game, visit{" "}
              <a href="/rooms" className="text-blue-500 underline">
                rooms
              </a>{" "}
              and organize a game with other players.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
