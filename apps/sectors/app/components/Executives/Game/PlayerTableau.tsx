"use client";
import {
  CardLocation,
  CardSuit,
  ExecutivePhaseName,
  InfluenceLocation,
} from "@server/prisma/prisma.client";
import PlayingCard from "./Card";
import Relationship from "./Relationship";
import Influence from "./Influence";
import { CardStack } from "./CardStack";
import { trpc } from "@sectors/app/trpc";
import PlayerAvatar from "../Player/PlayerAvatar";
import { useExecutiveGame } from "./GameContext";
import { Avatar, AvatarGroup, Radio, RadioGroup } from "@nextui-org/react";
import { RELATIONSHIP_TRACK_LENGTH } from "@server/data/executive_constants";
import { ActionWrapper } from "./ActionWrapper";
import { InfluenceInput } from "../Player/InfluenceInput";
import { useState } from "react";
import { CardList } from "./CardList";
import { InfluenceBidWithInfluence } from "@server/prisma/prisma.types";
import DebounceButton from "../../General/DebounceButton";
import { PlayerPassed } from "../Player/PlayerPassed";

//TODO: Add green border to active area on tableau
const InfluenceBids = ({
  toPlayerId,
  currentTurnId,
  isInteractive,
}: {
  toPlayerId: string;
  currentTurnId: string;
  isInteractive?: boolean;
}) => {
  const [influenceDestination, setInfluenceDestination] =
    useState<InfluenceLocation>(InfluenceLocation.OWNED_BY_PLAYER);
  const {
    data: executiveInfluenceBids,
    isLoading,
    isError,
    refetch,
  } = trpc.executiveInfluence.listInfluenceBids.useQuery({
    where: {
      toPlayerId,
      executiveGameTurnId: currentTurnId,
    },
  });
  const moveInfluenceBidToPlayer =
    trpc.executiveInfluence.moveInfluenceBidToPlayer.useMutation();
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error</div>;
  }
  if (!executiveInfluenceBids) {
    return <div>No bids found</div>;
  }
  if (executiveInfluenceBids.length === 0) {
    return <div>No bids</div>;
  }
  //group influenceBids by playerIds
  const flattenedInfluenceBids = executiveInfluenceBids.flatMap(
    (bid) => bid.influenceBids
  );
  const influenceBidsGrouped = flattenedInfluenceBids.reduce(
    (acc: Record<string, InfluenceBidWithInfluence[]>, influenceBid) => {
      const selfPlayerId = influenceBid.Influence.selfPlayerId;

      if (selfPlayerId === null) {
        return acc;
      }

      if (!acc[selfPlayerId]) {
        acc[selfPlayerId] = [];
      }

      acc[selfPlayerId].push(influenceBid);
      return acc;
    },
    {}
  );

  return (
    <div className="flex flex-row gap-2">
      {Object.keys(influenceBidsGrouped).map((bid) => (
        <>
          {isInteractive ? (
            <ActionWrapper
              acceptCallback={() => {
                return new Promise<void>((resolve) => {
                  moveInfluenceBidToPlayer.mutate(
                    {
                      executiveInfluenceBidId:
                        influenceBidsGrouped[bid][0].executiveInfluenceBidId ||
                        "",
                      targetLocation: influenceDestination,
                    },
                    {
                      onSettled: () => {
                        resolve(); // Resolve the promise here
                      },
                    }
                  );
                });
              }}
              optionsNode={
                <div className="flex flex-col gap-2 justify-center items-center">
                  <Influence
                    playerId={bid}
                    influenceCount={influenceBidsGrouped[bid].length}
                  />
                  <RadioGroup
                    label="Select Where To Move Influence"
                    color="warning"
                    value={influenceDestination}
                    onValueChange={(value) =>
                      setInfluenceDestination(value as InfluenceLocation)
                    }
                  >
                    <Radio value={InfluenceLocation.OWNED_BY_PLAYER}>
                      Influence
                    </Radio>
                    <Radio value={InfluenceLocation.RELATIONSHIP}>
                      Relationship
                    </Radio>
                  </RadioGroup>
                </div>
              }
            >
              <Influence
                playerId={bid}
                influenceCount={influenceBidsGrouped[bid].length}
              />
            </ActionWrapper>
          ) : (
            <Influence
              playerId={bid}
              influenceCount={influenceBidsGrouped[bid].length}
            />
          )}
        </>
      ))}
    </div>
  );
};

const Relationships = ({ playerId }: { playerId: string }) => {
  const {
    data: relationships,
    isLoading,
    isError,
    refetch,
  } = trpc.executiveInfluence.listInfluences.useQuery({
    where: {
      ownedByPlayerId: playerId,
      influenceLocation: InfluenceLocation.RELATIONSHIP,
    },
  });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error</div>;
  }
  if (!relationships) {
    return <div>No relationships found</div>;
  }
  //group by selfPlayerId
  const groupedRelationships = relationships.reduce((acc, relationship) => {
    if (relationship.selfPlayerId !== null) {
      if (!acc[relationship.selfPlayerId]) {
        acc[relationship.selfPlayerId] = [];
      }
      acc[relationship.selfPlayerId].push(relationship);
    }
    return acc;
  }, {} as Record<string, (typeof relationships)[0][]>);
  console.log("groupedRelationships", groupedRelationships);
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: RELATIONSHIP_TRACK_LENGTH }).map((_, index) => {
        const selfPlayerId = Object.keys(groupedRelationships)[index];
        const relationships = groupedRelationships[selfPlayerId] || [];
        return (
          <Relationship
            key={selfPlayerId}
            playerId={selfPlayerId}
            influenceCount={relationships.length}
          />
        );
      })}
    </div>
  );
};

const Gifts = ({ playerId }: { playerId: string }) => {
  const {
    data: playerGifts,
    isLoading,
    isError,
    refetch,
  } = trpc.executiveCard.listExecutiveCards.useQuery({
    where: {
      playerId,
      cardLocation: CardLocation.GIFT,
    },
  });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error</div>;
  }
  if (!playerGifts) {
    return <div>No gifts found</div>;
  }
  if (playerGifts.length === 0) {
    return <div>No gifts.</div>;
  }
  return (
    <div>
      {playerGifts.map((gift) => (
        <PlayingCard cardNumber={gift.cardValue} cardSuit={gift.cardSuit} />
      ))}
    </div>
  );
};

const PlayerInfluence = ({ playerId }: { playerId: string }) => {
  const {
    data: playerInfluence,
    isLoading,
    isError,
    refetch,
  } = trpc.executiveInfluence.listInfluences.useQuery({
    where: {
      ownedByPlayerId: playerId,
    },
  });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error</div>;
  }
  if (!playerInfluence) {
    return <div>No influence found</div>;
  }
  //group influence by selfPlayerId
  const groupedPlayerInfluence = playerInfluence.reduce((acc, influence) => {
    if (influence.selfPlayerId !== null) {
      if (!acc[influence.selfPlayerId]) {
        acc[influence.selfPlayerId] = [];
      }
      acc[influence.selfPlayerId].push(influence);
    }
    return acc;
  }, {} as Record<string, (typeof playerInfluence)[0][]>);

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(groupedPlayerInfluence).map(
        ([selfPlayerId, influences]) => (
          <div key={selfPlayerId} className="flex gap-1">
            <Influence
              playerId={selfPlayerId}
              influenceCount={influences.length}
            />
          </div>
        )
      )}
    </div>
  );
};
const Hand = ({ playerId }: { playerId: string }) => {
  const { authPlayer } = useExecutiveGame();
  const {
    data: playerHand,
    isLoading,
    isError,
    refetch,
  } = trpc.executiveCard.listConcealedCards.useQuery({
    where: {
      playerId,
    },
  });
  const handCards = playerHand?.filter((card) => card.cardLocation === "HAND");
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error</div>;
  }
  if (!handCards || handCards.length === 0) {
    return <div>No cards</div>;
  }
  if (!authPlayer) {
    return <div>No auth player</div>;
  }
  return (
    <div>
      {authPlayer.id === playerId ? (
        <CardList
          cards={authPlayer.cards.filter(
            (card) => card.cardLocation === CardLocation.HAND
          )}
        />
      ) : (
        <CardStack cards={handCards.length} />
      )}
    </div>
  );
};

const Bribe = ({
  playerId,
  isInteractive,
}: {
  playerId: string;
  isInteractive?: boolean;
}) => {
  const { authPlayer } = useExecutiveGame();
  const [influenceValue, setInfluenceValue] = useState(1);
  const createInfluenceBidMutation =
    trpc.executiveGame.createInfluenceBid.useMutation();
  if (!authPlayer) {
    return <div>No auth player</div>;
  }
  console.log("authPlayer", authPlayer);
  let selfInfluenceAuthPlayerOwns = authPlayer?.selfInfluence.filter(
    (influence) => influence.ownedByPlayerId === influence.selfPlayerId
  );
  if (!selfInfluenceAuthPlayerOwns) {
    selfInfluenceAuthPlayerOwns = [];
  }
  console.log("selfInfluenceAuthPlayerOwns", selfInfluenceAuthPlayerOwns);
  const maxInfluence = selfInfluenceAuthPlayerOwns.length;
  const minInfluence = 1;
  const {
    data: playerHand,
    isLoading,
    isError,
    refetch,
  } = trpc.executiveCard.listConcealedCards.useQuery({
    where: {
      playerId,
    },
  });
  const bribeCards = playerHand?.filter(
    (card) => card.cardLocation === "BRIBE"
  );
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error</div>;
  }
  if (!bribeCards || bribeCards.length === 0) {
    return <div>No cards</div>;
  }
  return (
    <div>
      {bribeCards?.map((card) =>
        card.cardValue && card.cardSuit ? (
          isInteractive ? (
            <ActionWrapper
              acceptCallback={() => {
                return new Promise<void>((resolve) => {
                  createInfluenceBidMutation.mutate(
                    {
                      fromPlayerId: authPlayer.id,
                      toPlayerId: playerId,
                      influenceAmount: influenceValue,
                    },
                    {
                      onSettled: () => {
                        setInfluenceValue(1);
                        resolve(); // Resolve the promise here
                      },
                    }
                  );
                });
              }}
              optionsNode={
                <InfluenceInput
                  setInfluenceValue={setInfluenceValue}
                  influenceValue={influenceValue.toString()}
                  influenceMin={minInfluence}
                  influenceMax={maxInfluence}
                />
              }
            >
              <PlayingCard
                cardNumber={card.cardValue}
                cardSuit={card.cardSuit}
              />
            </ActionWrapper>
          ) : (
            <PlayingCard cardNumber={card.cardValue} cardSuit={card.cardSuit} />
          )
        ) : null
      )}
    </div>
  );
};

export const PlayerTableau = ({ playerId }: { playerId: string }) => {
  const { gameState, currentPhase, isAuthPlayerPhasing, authPlayer } =
    useExecutiveGame();
  const player = gameState.players.find((p) => p.id === playerId);
  if (!player) {
    return <div>Player not found</div>;
  }
  if (!currentPhase) {
    return <div>Phase not found</div>;
  }
  const isAuthPlayerAndPhasing =
    isAuthPlayerPhasing && player.id == authPlayer?.id;
  return (
    <div
      className={`flex flex-col gap-3 p-5 rounded-md ${
        currentPhase?.activePlayerId == player.id
          ? "border-2 border-success-500"
          : ""
      }`}
    >
      <div className="flex flex-row gap-3">
        <div className="flex flex-row gap-2">
          <div className="flex flex-col gap-2 items-center justify-center">
            <AvatarGroup>
              <PlayerAvatar
                player={player}
                badgeContent={player.seatIndex.toString()}
              />
              {player.isCOO && <Avatar size="md" name="COO" />}
              {player.isGeneralCounsel && <Avatar size="md" name="GC" />}
            </AvatarGroup>
            {currentPhase.phaseName == ExecutivePhaseName.INFLUENCE_BID && (
              <PlayerPassed playerId={player.id} />
            )}
          </div>
        </div>
        <div>
          <div
            className={`relative border-2 border-dotted ${
              isAuthPlayerAndPhasing ? "border-success-500" : "border-gray-600"
            } rounded-lg p-4`}
          >
            <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
              BIDS
            </div>
            <div className="pt-2">
              <InfluenceBids
                toPlayerId={player.id}
                currentTurnId={currentPhase.gameTurnId}
                isInteractive={isAuthPlayerAndPhasing}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-row gap-3 mt-2">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 justify-center">
            {/* HAND Section */}
            <div className="relative border-2 border-dotted border-gray-600 rounded-lg p-4">
              <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
                HAND
              </div>
              <div className="pt-2">
                <Hand playerId={player.id} />
              </div>
            </div>

            {/* BRIBE Section */}
            <div className="relative border-2 border-dotted border-gray-600 rounded-lg p-4">
              <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
                BRIBE
              </div>
              <div className="pt-2">
                <Bribe
                  playerId={player.id}
                  isInteractive={
                    isAuthPlayerPhasing && player.id != authPlayer?.id
                  }
                />
              </div>
            </div>
          </div>
          <div className="flex flex-row flex-grow gap-3 justify-center items-center">
            <div className="relative border-2 border-dotted border-gray-600 rounded-lg p-4">
              <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
                RELATIONSHIPS
              </div>
              <div className="flex flex-col gap-2 items-center mt-2">
                <Relationships playerId={player.id} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="relative border-2 border-dotted border-gray-600 rounded-lg p-4">
            <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
              GIFTS
            </div>
            <div className="flex flex-wrap gap-1">
              <Gifts playerId={player.id} />
            </div>
          </div>
          <div className="relative border-2 border-dotted border-gray-600 rounded-lg p-4">
            <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
              INFLUENCE
            </div>
            <div className="flex flex-wrap gap-2 items-center mt-2">
              <PlayerInfluence playerId={player.id} />
            </div>
          </div>
          <div className="relative border-2 border-dotted border-gray-600 rounded-lg p-4">
            <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
              VOTES
            </div>
            <div className="flex flex-wrap gap-2 items-center mt-2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
