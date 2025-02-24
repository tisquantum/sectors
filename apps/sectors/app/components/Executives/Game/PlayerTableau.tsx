"use client";
import {
  CardLocation,
  CardSuit,
  ExecutiveCard,
  ExecutivePhaseName,
  InfluenceLocation,
  InfluenceType,
} from "@server/prisma/prisma.client";
import PlayingCard from "./Card";
import Relationship from "./Relationship";
import Influence from "./Influence";
import { CardStack } from "./CardStack";
import { trpc } from "@sectors/app/trpc";
import PlayerAvatar from "../Player/PlayerAvatar";
import { useExecutiveGame } from "./GameContext";
import {
  Avatar,
  AvatarGroup,
  Badge,
  Radio,
  RadioGroup,
  Switch,
} from "@nextui-org/react";
import { RELATIONSHIP_TRACK_LENGTH } from "@server/data/executive_constants";
import { ActionWrapper } from "./ActionWrapper";
import { InfluenceMultiInput } from "../Player/InfluenceMultiInput";
import { useEffect, useState } from "react";
import { CardList } from "./CardList";
import { InfluenceBidWithInfluence } from "@server/prisma/prisma.types";
import DebounceButton from "../../General/DebounceButton";
import { PlayerPassed } from "../Player/PlayerPassed";
import { toast } from "sonner";
import { RiLock2Fill, RiLockUnlockFill } from "@remixicon/react";
import { TakeNoBid } from "../Player/TakeNoBid";
import { Votes } from "../Player/Votes";
import { Agendas } from "../Player/Agenda";
import { InfluenceInput } from "../Player/InfluenceInput";

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
  const { pingCounter, currentPhase, gameId } = useExecutiveGame();
  const [influenceDestinations, setInfluenceDestinations] = useState<
    Record<string, InfluenceLocation>
  >({});

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
  useEffect(() => {
    refetch();
  }, [pingCounter, currentPhase?.id]);
  if (!gameId) {
    return <div>Game ID not found</div>;
  }
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
  console.log("executiveInfluenceBids", executiveInfluenceBids);
  //group influenceBids by playerIds
  // const flattenedInfluenceBids = executiveInfluenceBids.flatMap(
  //   (bid) => bid.influenceBids
  // );
  // const influenceBidsGrouped = executiveInfluenceBids.reduce(
  //   (acc: Record<string, InfluenceBidWithInfluence[]>, influenceBid) => {
  //     const fromPlayerId = influenceBid.fromPlayerId;

  //     if (fromPlayerId === null) {
  //       return acc;
  //     }

  //     if (!acc[fromPlayerId]) {
  //       acc[fromPlayerId] = [];
  //     }

  //     acc[fromPlayerId].push(influenceBid);
  //     return acc;
  //   },
  //   {}
  // );

  const hasBidBeenSelected = executiveInfluenceBids.some(
    (bid) => bid.isSelected
  );
  return (
    <div className="relative">
      <div className={`flex flex-row gap-2`}>
        {executiveInfluenceBids.map((bid) => {
          const groupedInfluenceBids = bid.influenceBids.reduce(
            (acc, influenceBid) => {
              const selfPlayerId = influenceBid.Influence.selfPlayerId;
              if (!selfPlayerId) {
                return acc;
              }
              if (!acc[selfPlayerId]) {
                acc[selfPlayerId] = [];
              }
              acc[selfPlayerId].push(influenceBid);
              return acc;
            },
            {} as Record<string, InfluenceBidWithInfluence[]>
          );

          return (
            <>
              {isInteractive ? (
                <ActionWrapper
                  acceptCallback={() => {
                    return new Promise<void>((resolve) => {
                      const influenceMoves = Object.keys(
                        groupedInfluenceBids
                      ).map((key) => ({
                        influenceIds: groupedInfluenceBids[key]?.map(
                          (influenceBid) => influenceBid.influenceId
                        ),
                        targetLocation:
                          influenceDestinations[
                            groupedInfluenceBids[key][0].Influence
                              .selfPlayerId || ""
                          ], // Assume influenceDestinations is a state mapping playerId to location
                      }));

                      moveInfluenceBidToPlayer.mutate(
                        {
                          executiveInfluenceBidId: bid.id || "",
                          influenceMoves,
                          gameId,
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
                    <div className="flex flex-wrap gap-2 justify-center items-center">
                      {Object.keys(groupedInfluenceBids).map((key) => (
                        <div key={key} className="flex flex-col gap-2">
                          <div className="flex flex-row gap-1">
                            <Influence
                              playerId={key}
                              influenceCount={groupedInfluenceBids[key].length}
                            />
                          </div>
                          <RadioGroup
                            label={`Move Influence`}
                            color="warning"
                            value={
                              influenceDestinations[
                                groupedInfluenceBids[key][0].Influence
                                  .selfPlayerId || ""
                              ]
                            } // Assume influenceDestinations is a state
                            onValueChange={(value) =>
                              setInfluenceDestinations((prev) => ({
                                ...prev,
                                [groupedInfluenceBids[key][0].Influence
                                  .selfPlayerId || ""]:
                                  value as InfluenceLocation,
                              }))
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
                      ))}
                    </div>
                  }
                >
                  <div className="flex flex-row gap-1">
                    <PlayerAvatar
                      player={bid.fromPlayer}
                      badgeContent={bid.influenceBids.length.toString()}
                    />
                    {Object.keys(groupedInfluenceBids).map((key) => (
                      <Influence
                        key={key}
                        playerId={key || ""}
                        influenceCount={groupedInfluenceBids[key].length}
                      />
                    ))}
                  </div>
                </ActionWrapper>
              ) : (
                <div className="flex flex-row gap-1">
                  <PlayerAvatar player={bid.fromPlayer} />
                  {Object.keys(groupedInfluenceBids).map((key) => (
                    <div className="flex relative" key={key}>
                      <Influence
                        playerId={key || ""}
                        influenceCount={groupedInfluenceBids[key].length}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        })}
      </div>
      {hasBidBeenSelected && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
          <span className="text-white font-bold">Selected</span>
        </div>
      )}
    </div>
  );
};

const Relationships = ({ playerId }: { playerId: string }) => {
  const { pingCounter, currentPhase } = useExecutiveGame();
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
  useEffect(() => {
    refetch();
  }, [pingCounter, currentPhase?.id]);
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
const Gifts = ({
  playerId,
  isInteractive,
}: {
  playerId: string;
  isInteractive?: boolean;
}) => {
  const playTrickMutation = trpc.executiveGame.playTrick.useMutation();
  const { pingCounter, currentPhase, gameId } = useExecutiveGame();
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
  useEffect(() => {
    refetch();
  }, [pingCounter, currentPhase?.id]);
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
    <div className="pt-2 flex flex-wrap gap-2">
      {playerGifts.map((gift) => (
        <>
          {isInteractive && !!!gift.isLocked ? (
            <ActionWrapper
              acceptCallback={() => {
                return new Promise<void>((resolve) => {
                  playTrickMutation.mutate(
                    {
                      gameId,
                      playerId,
                      cardId: gift.id,
                    },
                    {
                      onSettled: () => {
                        resolve(); // Resolve the promise here
                      },
                      onError: (error) => {
                        toast.error("Error playing trick: " + error.message);
                      },
                    }
                  );
                });
              }}
            >
              <PlayingCard
                cardNumber={gift.cardValue}
                cardSuit={gift.cardSuit}
                isLocked={gift.isLocked}
              />
            </ActionWrapper>
          ) : (
            <PlayingCard
              cardNumber={gift.cardValue}
              cardSuit={gift.cardSuit}
              isLocked={gift.isLocked}
            />
          )}
        </>
      ))}
    </div>
  );
};

const PlayerInfluence = ({
  playerId,
  isInteractive,
}: {
  playerId: string;
  isInteractive?: boolean;
}) => {
  const { pingCounter, currentPhase, gameId } = useExecutiveGame();
  const createPlayerVoteMutation =
    trpc.executiveGame.createPlayerVote.useMutation();
  const {
    data: playerInfluence,
    isLoading,
    isError,
    refetch,
  } = trpc.executiveInfluence.listInfluences.useQuery({
    where: {
      ownedByPlayerId: playerId,
      influenceLocation: {
        in: [InfluenceLocation.OWNED_BY_PLAYER, InfluenceLocation.OF_PLAYER],
      },
    },
  });
  useEffect(() => {
    refetch();
  }, [pingCounter, currentPhase?.id]);
  const [influenceToSubmit, setInfluenceToSubmit] = useState(1);
  if (!gameId) {
    return <div>Game ID not found</div>;
  }
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error</div>;
  }
  if (!playerInfluence) {
    return <div>No influence found</div>;
  }
  if (playerInfluence.length === 0) {
    return <div>No influence.</div>;
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
  //filter all influence of type ceo
  const ceoInfluence = playerInfluence.filter(
    (influence) => influence.influenceType === InfluenceType.CEO
  );
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(groupedPlayerInfluence).map(
        ([selfPlayerId, influences]) => (
          <div key={selfPlayerId} className="flex gap-1">
            {isInteractive ? (
              <ActionWrapper
                acceptCallback={() => {
                  return new Promise<void>((resolve) => {
                    createPlayerVoteMutation.mutate(
                      {
                        influenceIds: influences
                          .map((influence) => influence.id)
                          .splice(0, influenceToSubmit),
                        playerId,
                        gameId,
                      },
                      {
                        onSettled: () => {
                          resolve(); // Resolve the promise here
                        },
                        onError: (error) => {
                          toast.error(
                            "Error creating player vote: " + error.message
                          );
                        },
                      }
                    );
                  });
                }}
                optionsNode={
                  <InfluenceInput
                    setInfluenceValue={(value) => setInfluenceToSubmit(value)}
                    influenceValue={influenceToSubmit.toString()}
                    influenceMin={1}
                    influenceMax={influences.length}
                    title="Select Influence"
                  />
                }
              >
                <div className="cursor-pointer">
                  <Influence
                    playerId={selfPlayerId}
                    influenceCount={influences.length}
                  />
                </div>
              </ActionWrapper>
            ) : (
              <Influence
                playerId={selfPlayerId}
                influenceCount={influences.length}
              />
            )}
          </div>
        )
      )}
      {ceoInfluence.length > 0 && (
        <div className="flex gap-1">
          {isInteractive ? (
            <ActionWrapper
              acceptCallback={() => {
                return new Promise<void>((resolve) => {
                  createPlayerVoteMutation.mutate(
                    {
                      influenceIds: ceoInfluence
                        .map((influence) => influence.id)
                        .splice(0, influenceToSubmit),
                      playerId,
                      gameId,
                    },
                    {
                      onSettled: () => {
                        resolve(); // Resolve the promise here
                      },
                      onError: (error) => {
                        toast.error(
                          "Error creating player vote: " + error.message
                        );
                      },
                    }
                  );
                });
              }}
              optionsNode={
                <InfluenceInput
                  setInfluenceValue={(value) => setInfluenceToSubmit(value)}
                  influenceValue={influenceToSubmit.toString()}
                  influenceMin={1}
                  influenceMax={ceoInfluence.length}
                  title="Select Influence"
                />
              }
            >
              <div className="cursor-pointer">
                <Badge color="success" content={ceoInfluence.length.toString()}>
                  <Avatar name="CEO" size="sm" />
                </Badge>
              </div>
            </ActionWrapper>
          ) : (
            <Badge color="success" content={ceoInfluence.length.toString()}>
              <Avatar name="CEO" size="sm" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
const Hand = ({
  playerId,
  isInteractive,
}: {
  playerId: string;
  isInteractive?: boolean;
}) => {
  const { authPlayer, pingCounter, currentPhase } = useExecutiveGame();
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
  useEffect(() => {
    refetch();
  }, [pingCounter, currentPhase?.id]);
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
          isInteractive={isInteractive}
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
  const { authPlayer, pingCounter, currentPhase, gameId } = useExecutiveGame();
  const [influenceValues, setInfluenceValues] = useState<
    Record<string, number>
  >({}); //selfPlayerId, number of influence
  const createInfluenceBidMutation =
    trpc.executiveGame.createInfluenceBid.useMutation();
  const {
    data: bribeCards,
    isLoading,
    isError,
    refetch,
  } = trpc.executiveCard.listExecutiveCards.useQuery({
    where: {
      playerId,
      cardLocation: CardLocation.BRIBE,
    },
  });
  useEffect(() => {
    refetch();
  }, [pingCounter, currentPhase?.id]);
  if (!authPlayer) {
    return <div>No auth player</div>;
  }
  if (!gameId) {
    return <div>Game ID not found</div>;
  }
  let selfInfluenceAuthPlayerOwns = authPlayer?.selfInfluence.filter(
    (influence) => influence.ownedByPlayerId === influence.selfPlayerId
  );
  if (!selfInfluenceAuthPlayerOwns) {
    selfInfluenceAuthPlayerOwns = [];
  }
  const maxInfluence = selfInfluenceAuthPlayerOwns.length;
  const minInfluence = 1;
  const playerInfluences = authPlayer?.ownedByInfluence.reduce(
    (acc, influence) => {
      const playerId = influence.ownedByPlayerId;
      const selfPlayerId = influence.selfPlayerId;

      if (!selfPlayerId) {
        // Skip influences without a valid ownedByPlayerId
        return acc;
      }

      if (!playerId) {
        return acc;
      }

      // Initialize the array for this playerId if not already present
      if (!acc[selfPlayerId]) {
        acc[selfPlayerId] = {
          id: influence.id,
          selfPlayerId: influence.selfPlayerId,
          playerId,
          count: 0,
        };
      }

      // Check if an entry for this influence already exists
      const existingInfluence = acc[selfPlayerId];

      if (existingInfluence.count > 0) {
        // Increment the count if the influence already exists
        existingInfluence.count += 1;
      } else {
        // Add a new influence entry with count initialized to 1
        acc[selfPlayerId] = {
          id: influence.id,
          selfPlayerId: influence.selfPlayerId,
          playerId,
          count: 1, // Start the count at 1
        };
      }

      return acc;
    },
    {} as Record<
      string,
      {
        id: string;
        selfPlayerId: string | null;
        playerId: string;
        count: number;
      }
    >
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
                      influenceValues,
                      gameId,
                    },
                    {
                      onSettled: () => {
                        setInfluenceValues({});
                        resolve(); // Resolve the promise here
                      },
                      onError: (error) => {
                        toast.error(
                          "Error creating influence bid: " + error.message
                        );
                      },
                    }
                  );
                });
              }}
              optionsNode={
                <InfluenceMultiInput
                  setInfluenceValues={setInfluenceValues}
                  influenceValues={influenceValues}
                  influences={playerInfluences} // Assume this is provided as a prop or fetched dynamically
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
      className={`flex flex-col gap-3 p-5 rounded-md items-center justify-center ${
        currentPhase?.activePlayerId == player.id
          ? "border-2 border-success-500"
          : ""
      }`}
    >
      <div className="flex flex-row gap-2">
        <div
          className={`flex flex-col gap-2
        }`}
        >
          <div className="flex flex-row gap-3 mt-2">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2 justify-center">
                <div className="flex flex-row gap-2">
                  <div className="flex flex-col gap-2 items-center justify-center">
                    <AvatarGroup>
                      <PlayerAvatar
                        player={player}
                        badgeContent={player.seatIndex.toString()}
                      />
                      {player.isCOO && <Avatar size="md" name="COO" />}
                      {player.isGeneralCounsel && (
                        <Avatar size="md" name="GC" />
                      )}
                    </AvatarGroup>
                    {currentPhase.phaseName ==
                      ExecutivePhaseName.INFLUENCE_BID && (
                      <PlayerPassed playerId={player.id} />
                    )}
                    {isAuthPlayerAndPhasing &&
                      currentPhase.phaseName ==
                        ExecutivePhaseName.INFLUENCE_BID_SELECTION && (
                        <TakeNoBid />
                      )}
                  </div>
                </div>
                <div
                  className={`relative border-2 border-dotted ${
                    isAuthPlayerAndPhasing &&
                    currentPhase?.phaseName ==
                      ExecutivePhaseName.INFLUENCE_BID_SELECTION
                      ? "border-success-500"
                      : "border-gray-600"
                  } rounded-lg p-4`}
                >
                  <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
                    BIDS
                  </div>
                  <div className="pt-2 flex flex-col gap-2">
                    <InfluenceBids
                      toPlayerId={player.id}
                      currentTurnId={currentPhase.gameTurnId}
                      isInteractive={
                        isAuthPlayerAndPhasing &&
                        currentPhase?.phaseName ==
                          ExecutivePhaseName.INFLUENCE_BID_SELECTION
                      }
                    />
                  </div>
                </div>
                {/* BRIBE Section */}
                <div
                  className={`relative border-2 border-dotted ${
                    isAuthPlayerPhasing &&
                    player.id != authPlayer?.id &&
                    currentPhase?.phaseName == ExecutivePhaseName.INFLUENCE_BID
                      ? "border-success-500"
                      : "border-gray-600"
                  } rounded-lg p-4`}
                >
                  <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
                    BRIBE
                  </div>
                  <div className="pt-2">
                    {player.id && (
                      <Bribe
                        playerId={player.id}
                        isInteractive={
                          isAuthPlayerPhasing &&
                          currentPhase?.phaseName ==
                            ExecutivePhaseName.INFLUENCE_BID &&
                          player.id != authPlayer?.id
                        }
                      />
                    )}
                  </div>
                </div>
                {/* HAND Section */}
                <div
                  className={`hidden xl:block xl:relative border-2 border-dotted  ${
                    isAuthPlayerAndPhasing &&
                    player.id == authPlayer?.id &&
                    currentPhase?.phaseName == ExecutivePhaseName.SELECT_TRICK
                      ? "border-success-500"
                      : "border-gray-600"
                  } rounded-lg p-4`}
                >
                  <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
                    HAND
                  </div>
                  <div className="pt-2">
                    {player.id && (
                      <Hand
                        playerId={player.id}
                        isInteractive={
                          isAuthPlayerAndPhasing &&
                          player.id == authPlayer?.id &&
                          currentPhase?.phaseName ==
                            ExecutivePhaseName.SELECT_TRICK
                        }
                      />
                    )}
                  </div>
                </div>
              </div>
              {/* HAND Section */}
              <div
                className={`xl:hidden relative border-2 border-dotted  ${
                  isAuthPlayerAndPhasing &&
                  player.id == authPlayer?.id &&
                  currentPhase?.phaseName == ExecutivePhaseName.SELECT_TRICK
                    ? "border-success-500"
                    : "border-gray-600"
                } rounded-lg p-4`}
              >
                <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
                  HAND
                </div>
                <div className="pt-2">
                  {player.id && (
                    <Hand
                      playerId={player.id}
                      isInteractive={
                        isAuthPlayerAndPhasing &&
                        player.id == authPlayer?.id &&
                        currentPhase?.phaseName ==
                          ExecutivePhaseName.SELECT_TRICK
                      }
                    />
                  )}
                </div>
              </div>
              <div
                className={`xl:hidden flex-grow relative border-2 border-dotted ${
                  isAuthPlayerAndPhasing &&
                  player.id == authPlayer?.id &&
                  currentPhase?.phaseName == ExecutivePhaseName.SELECT_TRICK
                    ? "border-success-500"
                    : "border-gray-600"
                } rounded-lg p-4`}
              >
                <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
                  GIFTS
                </div>
                <div className="flex flex-wrap gap-1">
                  {player.id && (
                    <Gifts
                      playerId={player.id}
                      isInteractive={
                        isAuthPlayerAndPhasing &&
                        player.id == authPlayer?.id &&
                        currentPhase?.phaseName ==
                          ExecutivePhaseName.SELECT_TRICK
                      }
                    />
                  )}
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
                <div className="flex flex-col gap-3">
                  <div
                    className={`relative border-2 border-dotted ${
                      isAuthPlayerAndPhasing &&
                      player.id == authPlayer?.id &&
                      currentPhase?.phaseName == ExecutivePhaseName.VOTE
                        ? "border-success-500"
                        : "border-gray-600"
                    } border-gray-600 rounded-lg p-4`}
                  >
                    <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
                      INFLUENCE
                    </div>
                    <div className="flex flex-wrap gap-2 items-center mt-2">
                      <PlayerInfluence
                        playerId={player.id}
                        isInteractive={
                          isAuthPlayerAndPhasing &&
                          player.id == authPlayer?.id &&
                          currentPhase?.phaseName == ExecutivePhaseName.VOTE
                        }
                      />
                    </div>
                  </div>
                  <div className="relative border-2 border-dotted border-gray-600 rounded-lg p-4">
                    <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
                      VOTES
                    </div>
                    <div className="flex flex-wrap gap-2 items-center mt-2">
                      <Votes gameId={gameState.id} playerId={playerId} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {currentPhase.phaseName == ExecutivePhaseName.GAME_END ||
            (authPlayer?.id == player.id && <Agendas playerId={player.id} />)}
        </div>
        <div className="hidden xl:flex flex-col gap-3">
          <div
            className={`flex-grow relative border-2 border-dotted ${
              isAuthPlayerAndPhasing &&
              player.id == authPlayer?.id &&
              currentPhase?.phaseName == ExecutivePhaseName.SELECT_TRICK
                ? "border-success-500"
                : "border-gray-600"
            } rounded-lg p-4`}
          >
            <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
              GIFTS
            </div>
            <div className="flex flex-wrap gap-1">
              {player.id && (
                <Gifts
                  playerId={player.id}
                  isInteractive={
                    isAuthPlayerAndPhasing &&
                    player.id == authPlayer?.id &&
                    currentPhase?.phaseName == ExecutivePhaseName.SELECT_TRICK
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
