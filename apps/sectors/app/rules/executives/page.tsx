import { HandshakeIcon } from "lucide-react";

export default function ExecutivesRulesPage() {
  return (
    <div className="p-6 bg-slate-900">
      <div className="flex flex-col gap-1 justify-center content-center items-center text-slate-100  mb-8">
        <HandshakeIcon color="#5072A7" size={40} />
        <h1 className="text-4xl font-bold text-center">
          <span>THE EXECUTIVES</span>
        </h1>
      </div>

      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Components
        </h2>
        <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
          <li>Standard Playing Card Deck, all face-cards removed.</li>
          <li>8 Influence Tokens per player</li>
          <li>10 CEO Influence Tokens</li>
          <li>1 Vote Marker per player</li>
          <li>1 Hidden Agenda per player</li>
        </ul>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Game Overview
        </h2>
        <p className="text-gray-700 mb-6">
          The Executives is a trick-taking game where players compete as C-Suite
          executives attempting to seize control of the company from the legacy
          CEO.
        </p>
        <p className="text-gray-700 mb-6">
          As players take actions in The Executives, play will always move
          clockwise around the table.
        </p>
        <p className="text-gray-700 mb-6">
          The game is played over a series of turns. The first four turns follow
          influence bidding then trick taking. The final turn is for voting.
        </p>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Setup</h2>
        <p className="text-gray-700 mb-6">
          {" "}
          Each player receives 8 influence and one permanent vote marker.
          Additionally, each player is given a hidden agenda. This hidden agenda
          is a secret goal that the player must achieve in order to score
          additional points at the end of the game.
        </p>
        <p className="text-gray-700 mb-6">
          During the deal, each player will receive cards equal to the amount of
          tricks in that round face down. This is their hand which only that
          player can look at. Additionally, every player will receive one card
          for their bribe face up.
        </p>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Phases of a Turn
        </h2>
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Bribes | Turn 1-4
          </h3>
          <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
            <li>
              Starting with the General Counsel, players go clockwise around the
              table and place a bid of influence to take Bribe cards from other
              players.
            </li>
            <li>
              Once a bid is placed on a players bribe, a player can no longer
              place additional bids of influence on that players bribe.
            </li>
            <li>
              Players may pass, after a player passes they may no longer place
              bids of influence on any bribe.
            </li>
            <li>
              After all players have passed, starting with the COO, players take
              turns taking bribes from other players.
            </li>
            <li>
              When a player takes a bribe, they select all of the influence from
              one player. They may either take the full amount of this influence
              or divide it by half, rounding down, and "lock" the bribe they
              give to the player. The bribe card is then given to the player who
              placed the bid of influence on the bribe that was selected. The
              bribe card is placed in that players gift cards section. If the
              bribe is locked, it is tilted sideways to indicate it is so. If
              the bribe was locked the remaining influence is returned to the
              player who took the bribe.
            </li>
            <li>
              The player who has exchanged their bribe card for influence now
              moves all influence collected to either a relationship row or
              their personal influence. Relationships are filled once 3
              influence from the same player is collected. When placing
              influence in relationships, you must place all influence from the
              same player in the same relationship. You may never have two or
              more rows of relationships from the same players influence.
            </li>
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Trick-Taking Rounds | Turn 1-4
          </h3>
          <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
            <li>
              Players play trick-taking rounds to win influence from the legacy
              CEO.
            </li>
            <li>There are 4 turns, each with increasing influence to win:</li>
            <ul className="list-decimal list-inside ml-6 text-gray-700 space-y-1">
              <li>Turn 1: 1 Influence / 1 Trick</li>
              <li>Turn 2: 2 Influence / 2 Tricks</li>
              <li>Turn 3: 3 Influence / 3 Tricks</li>
              <li>Turn 4: 4 Influence / 4 Tricks</li>
            </ul>
            <li>The starting player of a trick taking round is the COO.</li>
            <li>
              When players play cards into a trick, they may either play from
              their hand or both their hand and their gift cards. The cards from
              which the player is choosing is their "pool" of cards.
            </li>
            <li>
              The first player to play a trick sets "the lead". The lead suit
              must be followed by all subsequent players if the cards they are
              selecting from have the lead suit. If a player does not have the
              lead suit, they may play any card from their pooled cards.
            </li>
            <li>
              After every player has played a card, the winner of the trick is
              determined. The winner of the trick is the player who played the
              highest card of the trump suit. If no trump suit was played, the
              winner of the trick is the player who played the highest card of
              the lead suit. The winner of the trick receives 1 influence from
              the legacy CEO. The winner of the trick becomes the new COO.
            </li>
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Final Voting | Turn 5
          </h3>
          <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
            <li>Players spend their collected influence to acquire votes.</li>
            <li>
              Starting with the COO, each player will have one opportunity to
              spend as much influence of one type each vote round. There are 4
              vote rounds.
            </li>
            <li>
              After all players place influence, the type of influence that was
              spent the most is the winning influence type. Each player who
              contributed to this influence receives 1 vote marker.
            </li>
          </ul>
        </div>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Scoring</h2>
        <p className="text-gray-700 mb-6">
          At the end of the game, the player or legacy CEO with the most vote
          markers becomes the new CEO. If the legacy CEO has the most vote
          markers, their position is handed over to the Foreign Investor. Given
          a tie, the CEO title can be shared amongst players and the Foreign
          Investor.
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Each gift: +1 point</li>
          <li>Each vote token: +2 points</li>
          <li>Each filled relationship: +3 points</li>
          <li>Hidden Agenda fulfilled: +4 points</li>
        </ul>
      </div>
    </div>
  );
}
