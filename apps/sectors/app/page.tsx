export default async function Home() {
  return (
    <div>
      <h1>Sectors</h1>
      <p>
        <span className="font-bold">Sectors</span> is a game of stocks and
        running companies. You play as an influential investor trying to make
        the most money through clever investments and company management. The
        winner of the game is the player with the greatest net worth at the end
        of the game.
      </p>
      <p>
        To see the dedicated rules page, please visit{" "}
        <a href="https://rules.sectors.gg">here</a>.
      </p>
      <p>
        To start or join a game, you must create an account or log in if you
        already have one. Click <a href="/login">here</a> to do so.
      </p>
      <p>
        To join a game, visit <a href="/rooms">rooms</a> and organize a game
        with other players.
      </p>
    </div>
  );
}
