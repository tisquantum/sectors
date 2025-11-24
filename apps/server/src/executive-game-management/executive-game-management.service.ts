import { Injectable } from '@nestjs/common';
import {
  Agenda,
  CardLocation,
  CardSuit,
  ExecutiveAgenda,
  ExecutiveCard,
  ExecutiveGameStatus,
  ExecutiveGameTurn,
  ExecutiveInfluenceBid,
  ExecutiveInfluenceVoteRound,
  ExecutivePhase,
  ExecutivePhaseName,
  ExecutivePlayer,
  InfluenceBid,
  InfluenceLocation,
  InfluenceType,
  TurnType,
  VictoryPointType,
} from '@prisma/client';
import {
  AGENDA_POINTS,
  BRIBE_CARD_HAND_SIZE,
  GIFT_POINTS,
  INFLUENCE_CEO_STARTING,
  INFLUENCE_PLAYER_STARTING,
  RELATIONSHIP_POINTS,
  ROUND_1_CARD_HAND_SIZE,
  ROUND_2_CARD_HAND_SIZE,
  ROUND_3_CARD_HAND_SIZE,
  ROUND_4_CARD_HAND_SIZE,
  TOTAL_TRICK_TURNS,
  VOTE_POINTS,
} from '@server/data/executive_constants';
import { ExecutiveCardService } from '@server/executive-card/executive-card.service';
import { ExecutiveGameTurnService } from '@server/executive-game-turn/executive-game-turn.service';
import { ExecutiveGameService } from '@server/executive-game/executive-game.service';
import { ExecutiveInfluenceBidService } from '@server/executive-influence-bid/executive-influence-bid.service';
import { ExecutiveInfluenceVoteRoundService } from '@server/executive-influence-vote-round/executive-influence-vote-round.service';
import { ExecutiveInfluenceService } from '@server/executive-influence/executive-influence.service';
import { ExecutivePhaseService } from '@server/executive-phase/executive-phase.service';
import { ExecutivePlayerService } from '@server/executive-player/executive-player.service';
import { PrismaService } from '@server/prisma/prisma.service';
import {
  ExecutiveInfluenceBidWithRelations,
  ExecutivePlayerWithRelations,
} from '@server/prisma/prisma.types';
import {
  EVENT_EXECUTIVE_GAME_STARTED,
  EVENT_EXECUTIVE_NEW_PHASE,
  EVENT_PING_PLAYERS,
  getExecutiveGameChannelId,
  getGameChannelId,
  getRoomChannelId,
} from '@server/pusher/pusher.types';
import { PusherService } from 'nestjs-pusher';

@Injectable()
export class ExecutiveGameManagementService {
  //TODO: pre-fetching plus this to speed up the game
  private gameCache = new Map<
    string,
    {
      players?: ExecutivePlayer[];
      influenceBids?: ExecutiveInfluenceBidWithRelations[];
      currentGameTurn?: ExecutiveGameTurn | null;
      currentGameTurnId?: string;
      currentTrumpCard?: ExecutiveCard | null;
      currentPhase?: ExecutivePhase | null;
    }
  >();

  constructor(
    private prisma: PrismaService,
    private pusher: PusherService,
    private gameService: ExecutiveGameService,
    private playerService: ExecutivePlayerService,
    private cardService: ExecutiveCardService,
    private influenceService: ExecutiveInfluenceService,
    private influenceBidService: ExecutiveInfluenceBidService,
    private phaseService: ExecutivePhaseService,
    private gameTurnService: ExecutiveGameTurnService,
    private influenceVoteRoundService: ExecutiveInfluenceVoteRoundService,
  ) {}

  async resolvePhase({
    gameTurn,
    phaseName,
    activePlayerId,
    phaseId,
  }: {
    gameTurn: ExecutiveGameTurn;
    phaseName: ExecutivePhaseName;
    phaseId: string;
    activePlayerId?: string;
  }) {
    switch (phaseName) {
      case ExecutivePhaseName.START_GAME:
        await this.nextPhase(gameTurn.gameId, gameTurn.id, phaseName);
        return;
      case ExecutivePhaseName.START_TURN:
        const players =
          await this.playerService.listExecutivePlayersNoRelations({
            where: {
              gameId: gameTurn.gameId,
            },
          });
        const currentCache = this.gameCache.get(gameTurn.gameId);
        this.gameCache.set(gameTurn.gameId, {
          ...currentCache,
          currentGameTurnId: gameTurn.id,
          currentGameTurn: gameTurn,
          players: players,
        });
        await this.boardCleanup(gameTurn.gameId);
        await this.nextPhase(gameTurn.gameId, gameTurn.id, phaseName);
        break;
      case ExecutivePhaseName.DEAL_CARDS:
        await this.dealCards(
          gameTurn.gameId,
          this.getCardHandSizeForTurn(gameTurn.turnNumber),
        );
        await this.setTrumpCard(gameTurn.gameId);
        await this.nextPhase(gameTurn.gameId, gameTurn.id, phaseName);
        break;
      case ExecutivePhaseName.MOVE_COO_AND_GENERAL_COUNSEL:
        await this.resolveMoveCOOAndGeneralCounsel(gameTurn.gameId);
        await this.nextPhase(gameTurn.gameId, gameTurn.id, phaseName);
        break;
      case ExecutivePhaseName.INFLUENCE_BID:
        await this.determineInfluenceBidder(
          gameTurn.gameId,
          gameTurn.id,
          phaseId,
        );
        await this.pingPlayers(gameTurn.gameId);
        break;
      case ExecutivePhaseName.INFLUENCE_BID_SELECTION:
        this.prefetchInfluenceBidData(gameTurn.id);
        await this.determineInfluenceBidSelector(
          gameTurn.id,
          gameTurn.gameId,
          phaseId,
        );
        await this.pingPlayers(gameTurn.gameId);
        break;
      case ExecutivePhaseName.START_TRICK:
        await this.startTrick(gameTurn.gameId, gameTurn.id);
        await this.nextPhase(gameTurn.gameId, gameTurn.id, phaseName);
        break;
      case ExecutivePhaseName.SELECT_TRICK:
        if (!activePlayerId) {
          await this.determineTrickBidder(gameTurn);
          await this.pingPlayers(gameTurn.gameId);
        }
        break;
      case ExecutivePhaseName.RESOLVE_TRICK:
        await this.resolveTrickWinner(gameTurn.id, gameTurn.gameId);
        await this.newTrickOrTurn(gameTurn.gameId, gameTurn);
        break;
      case ExecutivePhaseName.START_VOTE:
        await this.createVoteRound(gameTurn.gameId, gameTurn.id);
        await this.selectInitialVoter(gameTurn.gameId, gameTurn.id);
        break;
      case ExecutivePhaseName.RESOLVE_VOTE:
        await this.resolveVote(gameTurn.id);
        await this.nextVoteRoundOrEndGame(gameTurn.gameId, gameTurn);
        break;
      case ExecutivePhaseName.GAME_END:
        await this.endGame(gameTurn.gameId, gameTurn.id);
        await this.pingPlayers(gameTurn.gameId);
        break;
      default:
        return;
    }
  }

  async fulfillRelationshipAndMoveInfluence(gameId: string) {
    //get all players
    const players = await this.playerService.listExecutivePlayers({
      where: {
        gameId,
      },
    });
    if (!players) {
      throw new Error('Players not found');
    }
    const influencePromises = players.map((player) => {
      const relationshipInfluence = player.ownedByInfluence.filter(
        (influence) =>
          influence.influenceLocation === InfluenceLocation.RELATIONSHIP,
      );

      // Organize the relationships
      const relationshipCounts = relationshipInfluence.reduce(
        (acc, influence) => {
          if (influence.selfPlayerId) {
            acc[influence.selfPlayerId] =
              (acc[influence.selfPlayerId] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>,
      );

      // Iterate over the relationships and move the influence
      return Promise.all(
        Object.entries(relationshipCounts).map(([selfPlayerId, count]) => {
          if (count < 3) {
            return this.influenceService.createManyInfluence(
              Array.from({ length: count }).map(() => ({
                gameId,
                selfPlayerId,
                ownedByPlayerId: selfPlayerId,
                influenceType: InfluenceType.PLAYER,
                influenceLocation: InfluenceLocation.OF_PLAYER,
              })),
            );
          } else {
            return Promise.all([
              this.influenceService.createManyInfluence(
                Array.from({ length: count - 1 }).map(() => ({
                  gameId,
                  selfPlayerId,
                  ownedByPlayerId: selfPlayerId,
                  influenceType: InfluenceType.PLAYER,
                  influenceLocation: InfluenceLocation.OF_PLAYER,
                })),
              ),
              this.influenceService.createInfluence({
                Game: { connect: { id: gameId } },
                selfPlayer: { connect: { id: selfPlayerId } },
                ownedByPlayer: { connect: { id: player.id } },
                influenceType: InfluenceType.PLAYER,
                influenceLocation: InfluenceLocation.OWNED_BY_PLAYER,
              }),
            ]);
          }
        }),
      );
    });
    await Promise.all(influencePromises);
  }
  async setTrumpCard(gameId: string) {
    //get the trump card
    const trumpCard = await this.cardService.findExecutiveCard({
      gameId,
      cardLocation: CardLocation.TRUMP,
    });
    //set in local cache
    const currentCache = this.gameCache.get(gameId);
    this.gameCache.set(gameId, {
      ...currentCache,
      currentTrumpCard: trumpCard,
    });
  }

  async prefetchInfluenceBidData(gameTurnId: string) {
    // Get gameId from the turn to use correct cache key
    const gameTurn = await this.gameTurnService.getExecutiveGameTurn({
      id: gameTurnId,
    });
    if (!gameTurn) {
      return;
    }
    
    //influenceBids
    let influenceBids =
      await this.influenceBidService.listExecutiveInfluenceBids({
        where: {
          executiveGameTurnId: gameTurnId,
        },
      });
    if (influenceBids) {
      const currentCache = this.gameCache.get(gameTurn.gameId);
      this.gameCache.set(gameTurn.gameId, { ...currentCache, influenceBids });
    }
  }

  async nextVoteRoundOrEndGame(gameId: string, gameTurn: ExecutiveGameTurn) {
    const gameCache = this.gameCache.get(gameId);
    //get players
    const players =
      gameCache?.players ??
      (await this.playerService.listExecutivePlayersNoRelations({
        where: {
          gameId,
        },
      }));
    if (!players) {
      throw new Error('Players not found');
    }
    //get the vote rounds
    const voteRounds = await this.influenceVoteRoundService.listVoteRounds({
      where: {
        gameId,
      },
    });
    if (voteRounds.length < players.length) {
      await this.nextPhase(
        gameId,
        gameTurn.id,
        ExecutivePhaseName.RESOLVE_VOTE,
      );
    } else {
      await this.startPhase({
        gameId,
        gameTurnId: gameTurn.id,
        phaseName: ExecutivePhaseName.GAME_END,
      });
    }
  }

  async endGame(gameId: string, gameTurnId: string) {
    //get all players
    const players = await this.playerService.listExecutivePlayers({
      where: {
        gameId,
      },
    });
    if (!players) {
      throw new Error('Players not found');
    }
    //count gifts
    const playerGiftsPromises = players.map((player) => {
      const giftLength = player.cards.filter(
        (card) => card.cardLocation == CardLocation.GIFT,
      ).length;
      return this.prisma.executiveVictoryPoint.create({
        data: {
          game: { connect: { id: gameId } },
          victoryPoint: giftLength * GIFT_POINTS,
          victoryPointType: VictoryPointType.GIFT,
          player: { connect: { id: player.id } },
        },
      });
    });
    //count player votes
    const playerVotesPointsPromises = players.map((player) => {
      const voteMarkers = player.voteMarkerOwner.length;
      return this.prisma.executiveVictoryPoint.create({
        data: {
          game: { connect: { id: gameId } },
          victoryPoint: voteMarkers * VOTE_POINTS,
          victoryPointType: VictoryPointType.VOTE,
          player: { connect: { id: player.id } },
        },
      });
    });
    //relationship points
    const playerRelationshipPointsPromises = players.map((player) => {
      const influenceCounts = player.ownedByInfluence
        .filter(
          (influence) =>
            influence.influenceLocation === InfluenceLocation.RELATIONSHIP,
        )
        .reduce(
          (acc, influence) => {
            if (influence.selfPlayerId) {
              acc[influence.selfPlayerId] =
                (acc[influence.selfPlayerId] || 0) + 1;
            }
            return acc;
          },
          {} as Record<string, number>,
        );

      const completedSets = Object.values(influenceCounts).filter(
        (count) => count >= 3,
      ).length;

      return this.prisma.executiveVictoryPoint.create({
        data: {
          game: { connect: { id: gameId } },
          victoryPoint: completedSets * RELATIONSHIP_POINTS,
          victoryPointType: VictoryPointType.RELATIONSHIP,
          player: { connect: { id: player.id } },
        },
      });
    });
    //find the ceo
    const voteResults = players
      .flatMap((player) => player.voteMarkerVoted)
      .reduce((acc: Record<string, number>, voteMarker) => {
        if (voteMarker.isCeo) {
          acc['FOREIGN_INVESTOR'] = (acc['FOREIGN_INVESTOR'] || 0) + 1;
        } else if (voteMarker.votedPlayerId) {
          acc[voteMarker.votedPlayerId] =
            (acc[voteMarker.votedPlayerId] || 0) + 1;
        }
        return acc;
      }, {});
    //for each player in the game, add +1 vote marker of their own type
    players.forEach((player) => {
      voteResults[player.id] = (voteResults[player.id] || 0) + 1;
    });
    const votedCeo = Object.entries(voteResults).reduce(
      (acc: { playerIds: string[]; count: number }, [playerId, count]) => {
        if (count > acc.count) {
          acc.count = count;
          acc.playerIds = [playerId];
        } else if (count === acc.count) {
          acc.playerIds.push(playerId);
        }
        return acc;
      },
      { playerIds: [], count: 0 },
    );

    //resolve agenda points
    const playerAgendaPoints = players.map((player) => {
      return {
        playerId: player.id,
        filledAgenda: this.didPlayerFulfillAgenda(
          player,
          players,
          player.agendas[0],
          votedCeo.playerIds.filter(
            (playerId) => playerId !== 'FOREIGN_INVESTOR',
          ),
        ),
      };
    });
    //calculate agenda points
    const agendaPointsPromises = playerAgendaPoints.map((playerAgenda) => {
      if (playerAgenda.playerId === 'FOREIGN_INVESTOR') {
        return;
      }
      if (playerAgenda.filledAgenda) {
        return this.prisma.executiveVictoryPoint.create({
          data: {
            game: { connect: { id: gameId } },
            victoryPoint: AGENDA_POINTS,
            victoryPointType: VictoryPointType.AGENDA,
            player: { connect: { id: playerAgenda.playerId } },
          },
        });
      }
    });
    await Promise.all([
      ...playerGiftsPromises,
      ...playerVotesPointsPromises,
      ...playerRelationshipPointsPromises,
      ...agendaPointsPromises,
    ]);
  }

  didPlayerFulfillAgenda(
    player: ExecutivePlayerWithRelations,
    players: ExecutivePlayerWithRelations[],
    agenda: ExecutiveAgenda,
    votedCeos: string[],
  ) {
    const playerCeoSeatIndexes = players
      .filter((player) => votedCeos.includes(player.id))
      .map((player) => player.seatIndex);

    switch (agenda.agendaType) {
      case Agenda.BECOME_CEO_NO_SHARE:
        return votedCeos.length == 1 && agenda.playerId === votedCeos[0];
      case Agenda.FOREIGN_INVESTOR_CEO:
        return votedCeos.length == 1 && votedCeos[0] === 'FOREIGN_INVESTOR';
      case Agenda.BECOME_CEO_WITH_FOREIGN_INVESTOR:
        return (
          votedCeos.includes('FOREIGN_INVESTOR') &&
          votedCeos.includes(agenda.playerId)
        );
      case Agenda.CEO_THREE_PLAYERS:
        return votedCeos.length >= 3;
      case Agenda.FIRST_LEFT_CEO: {
        const totalPlayers = players.length;
        const leftSeatIndex =
          (player.seatIndex - 1 + totalPlayers) % totalPlayers;
        return playerCeoSeatIndexes.includes(leftSeatIndex);
      }
      case Agenda.SECOND_LEFT_CEO: {
        const totalPlayers = players.length;
        const secondLeftSeatIndex =
          (player.seatIndex - 2 + totalPlayers) % totalPlayers;
        return playerCeoSeatIndexes.includes(secondLeftSeatIndex);
      }
      case Agenda.THIRD_LEFT_CEO: {
        const totalPlayers = players.length;
        const thirdLeftSeatIndex =
          (player.seatIndex - 3 + totalPlayers) % totalPlayers;
        return playerCeoSeatIndexes.includes(thirdLeftSeatIndex);
      }
      default:
        return false;
    }
  }

  async resolveVote(gameTurnId: string) {
    //get the latest game vote
    const voteRound = await this.influenceVoteRoundService.findLatestVoteRound({
      executiveGameTurnId: gameTurnId,
    });
    if (!voteRound) {
      throw new Error('Vote round not found');
    }
    //get the votes
    const votesInfluenceFlattened = voteRound.playerVotes.flatMap(
      (playerVote) => playerVote.influence,
    );
    //see what is the most influence of selfPlayerId OR influenceType of CEO

    // Group influence counts by `selfPlayerId` and `CEO` type
    const influenceCounts: Record<string, number> = {};

    votesInfluenceFlattened.forEach((influence) => {
      if (influence.influenceType === InfluenceType.CEO) {
        // Use 'CEO' as the key for CEO influence
        influenceCounts['CEO'] = (influenceCounts['CEO'] || 0) + 1;
      } else if (influence.selfPlayerId) {
        // Use `selfPlayerId` as the key for player influence
        const key = influence.selfPlayerId;
        influenceCounts[key] = (influenceCounts[key] || 0) + 1;
      }
    });

    // Determine the highest influence count
    let maxInfluenceKey = null;
    let maxInfluenceCount = 0;

    for (const [key, count] of Object.entries(influenceCounts)) {
      if (count > maxInfluenceCount) {
        maxInfluenceCount = count;
        maxInfluenceKey = key;
      }
    }
    //get all players who voted for the max influence
    const winningPlayers = voteRound.playerVotes.filter((playerVote) =>
      playerVote.influence.some(
        (influence) =>
          (influence.influenceType === InfluenceType.CEO &&
            maxInfluenceKey === 'CEO') ||
          (influence.selfPlayerId === maxInfluenceKey &&
            influence.influenceType === InfluenceType.PLAYER),
      ),
    );
    //TODO: need to figure out how to store the winner and distribute those winner influence as VOTES under a player
    const voteMarkers = await this.prisma.voteMarker.createManyAndReturn({
      data: winningPlayers.map((player) => ({
        influenceVoteRoundId: voteRound.id,
        owningPlayerId: player.playerId,
        gameId: voteRound.gameId,
        votedPlayerId: maxInfluenceKey != 'CEO' ? maxInfluenceKey : null,
        isCeo: maxInfluenceKey === 'CEO',
      })),
    });
    return voteMarkers;
  }

  async createVoteRound(gameId: string, gameTurnId: string) {
    //create executive influence vote
    await this.influenceVoteRoundService.createVoteRound({
      game: { connect: { id: gameId } },
      ExecutiveGameTurn: { connect: { id: gameTurnId } },
    });
  }

  async selectInitialVoter(gameId: string, gameTurnId: string) {
    //get the coo
    const coo = await this.playerService.findExecutivePlayer({
      gameId,
      isCOO: true,
    });
    if (!coo) {
      throw new Error('COO not found');
    }
    //start the vote phase
    await this.startPhase({
      gameId,
      gameTurnId,
      phaseName: ExecutivePhaseName.VOTE,
      activePlayerId: coo.id,
    });
  }

  determineNextExecutivePhaseTrick(phaseName: ExecutivePhaseName) {
    switch (phaseName) {
      case ExecutivePhaseName.START_GAME:
        return ExecutivePhaseName.START_TURN;
      case ExecutivePhaseName.START_TURN:
        return ExecutivePhaseName.DEAL_CARDS;
      case ExecutivePhaseName.DEAL_CARDS:
        return ExecutivePhaseName.MOVE_COO_AND_GENERAL_COUNSEL;
      case ExecutivePhaseName.MOVE_COO_AND_GENERAL_COUNSEL:
        return ExecutivePhaseName.INFLUENCE_BID;
      case ExecutivePhaseName.START_TRICK:
        return ExecutivePhaseName.SELECT_TRICK;
      case ExecutivePhaseName.START_VOTE:
        return ExecutivePhaseName.VOTE;
      case ExecutivePhaseName.RESOLVE_VOTE:
        return ExecutivePhaseName.START_VOTE;
      default:
        console.error('No next phase found, this is an assertion basically.');
        return null;
    }
  }

  async boardCleanup(gameId: string) {
    // Only clean up cards from the previous turn (TRICK and TRUMP)
    // Do NOT clear HAND and BRIBE cards as those are for the current turn
    const cardsInPlay = await this.cardService.listExecutiveCards({
      where: {
        gameId,
        cardLocation: {
          in: [
            CardLocation.TRICK,
            CardLocation.TRUMP,
            // NOTE: We intentionally exclude HAND and BRIBE here
            // because those are dealt fresh each turn and should not be cleared
          ],
        },
      },
    });
    
    if (cardsInPlay.length === 0) {
      return;
    }

    // Batch update all cards at once instead of individual updates
    const cardIds = cardsInPlay.map((card) => card.id);
    await this.prisma.executiveCard.updateMany({
      where: {
        id: { in: cardIds },
      },
      data: {
        cardLocation: CardLocation.DECK,
        playerId: null,
      },
    });
    
    // Invalidate cache for this game since we've moved cards back to deck
    // This ensures the card service cache reflects the updated card locations
    const cachedCards = this.cardService['cardCache']?.get(gameId);
    if (cachedCards) {
      cardIds.forEach((cardId) => {
        const card = cachedCards.find((c) => c.id === cardId);
        if (card) {
          card.cardLocation = CardLocation.DECK;
          card.playerId = null;
        }
      });
    }
  }

  async newTrickOrTurn(gameId: string, gameTurn: ExecutiveGameTurn) {
    //get tricks for game turn
    const executiveTricks = await this.prisma.executiveTrick.findMany({
      where: {
        turnId: gameTurn.id,
      },
    });
    if (
      executiveTricks.length < this.getCardHandSizeForTurn(gameTurn.turnNumber)
    ) {
      await this.startPhase({
        gameId,
        gameTurnId: gameTurn.id,
        phaseName: ExecutivePhaseName.START_TRICK,
      });
    } else {
      await this.startNewTurn(gameId, gameTurn.id);
    }
  }

  async startNewTurn(gameId: string, currentGameTurnId: string) {
    //get the game turn
    const currentGameTurn = await this.gameTurnService.getExecutiveGameTurn({
      id: currentGameTurnId,
    });
    if (!currentGameTurn) {
      throw new Error('Game turn not found');
    }
    //get all game turns for game
    const gameTurns = await this.gameTurnService.listExecutiveGameTurns({
      where: {
        gameId,
      },
    });
    let newTurn: ExecutiveGameTurn | null = null;
    //if there have been 4 turns, proceed to a voting turn
    if (gameTurns.length === TOTAL_TRICK_TURNS) {
      //create a new game turn
      newTurn = await this.gameTurnService.createExecutiveGameTurn({
        game: { connect: { id: gameId } },
        turnNumber: currentGameTurn.turnNumber + 1,
        turnType: TurnType.INFLUENCE,
      });
    } else {
      //create a new game turn
      newTurn = await this.gameTurnService.createExecutiveGameTurn({
        game: { connect: { id: gameId } },
        turnNumber: currentGameTurn.turnNumber + 1,
        turnType: TurnType.TRICK,
      });
    }
    if (!newTurn) {
      throw new Error('New turn not found');
    }
    if (newTurn.turnType === TurnType.INFLUENCE) {
      await this.fulfillRelationshipAndMoveInfluence(gameId);
      //start the new phase
      await this.startPhase({
        gameId,
        gameTurnId: newTurn.id,
        phaseName: ExecutivePhaseName.START_VOTE,
      });
    } else {
      //start the new phase
      await this.startPhase({
        gameId,
        gameTurnId: newTurn.id,
        phaseName: ExecutivePhaseName.START_TURN,
      });
    }
  }

  async determineTrickBidder(gameTurn: ExecutiveGameTurn) {
    const gameCache = this.gameCache.get(gameTurn.gameId);
    //get the players
    const players =
      gameCache?.players ??
      (await this.playerService.listExecutivePlayersNoRelations({
        where: {
          gameId: gameTurn.gameId,
        },
      }));
    if (!players) {
      throw new Error('Players not found');
    }
    
    // Fetch trick and current phase in parallel for better performance
    const [trick, currentPhase] = await Promise.all([
      this.prisma.executiveTrick.findFirst({
        where: {
          turnId: gameTurn.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          trickCards: true,
          phases: true,
        },
      }),
      this.phaseService.getCurrentPhase(gameTurn.gameId),
    ]);
    
    if (!trick) {
      throw new Error('Trick not found');
    }
    if (!currentPhase) {
      throw new Error('Current phase not found');
    }
    
    //if the trick has cards played equal to the number of players, start the next phase
    if (trick.trickCards.length === players.length) {
      return await this.startPhase({
        gameId: gameTurn.gameId,
        gameTurnId: gameTurn.id,
        phaseName: ExecutivePhaseName.RESOLVE_TRICK,
      });
    }
    //get the previous phase
    const previousSelectTrickOfExecutiveTrickPhase = trick.phases
      .filter((phase) => phase.phaseName === ExecutivePhaseName.SELECT_TRICK)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
    let nextPlayer: ExecutivePlayer | null = null;
    if (!previousSelectTrickOfExecutiveTrickPhase) {
      //get the COO player - check cache first, then database
      const cachedCOO = players.find((p) => p.isCOO);
      if (cachedCOO) {
        nextPlayer = cachedCOO;
      } else {
        // If not in cache, query database
        nextPlayer = await this.playerService.findExecutivePlayer({
          gameId: gameTurn.gameId,
          isCOO: true,
        });
        if (!nextPlayer) {
          console.error('COO not found in cache or database');
          throw new Error('COO not found');
        }
        // Update cache with the COO player
        const gameCache = this.gameCache.get(gameTurn.gameId);
        if (gameCache) {
          this.gameCache.set(gameTurn.gameId, {
            ...gameCache,
            players: players.map((p) => ({
              ...p,
              isCOO: p.id === nextPlayer!.id,
            })),
          });
        }
      }
    } else {
      if (!previousSelectTrickOfExecutiveTrickPhase.activePlayerId) {
        console.error('Active player not found');
        throw new Error('Active player not found');
      }
      //get the player
      const previousPlayer =
        await this.playerService.getExecutivePlayerNoRelations({
          id: previousSelectTrickOfExecutiveTrickPhase.activePlayerId,
        });
      if (!previousPlayer) {
        console.error('Previous player not found');
        throw new Error('Previous player not found');
      }
      //get the next player
      nextPlayer = this.findNewActivePlayer(previousPlayer, players);
      if (nextPlayer.isCOO) {
        //we have gone around the table and the bidding selection is done, move to trick taking
        await this.startPhase({
          gameId: gameTurn.gameId,
          gameTurnId: gameTurn.id,
          phaseName: ExecutivePhaseName.RESOLVE_TRICK,
        });
      }
    }
    if (!nextPlayer) {
      throw new Error('Next player not found');
    }
    //update the phase
    return await this.phaseService.updateExecutivePhase({
      where: { id: currentPhase.id },
      data: {
        ExecutiveTrick: { connect: { id: trick.id } },
        player: { connect: { id: nextPlayer.id } },
      },
    });
  }

  async startTrick(gameId: string, gameTurnId: string) {
    // Discard any bribe cards that were not bid on (not selected)
    // Bribe cards that are not bid on should be discarded, not put back in the deck
    const allBribeCards = await this.cardService.listExecutiveCards({
      where: {
        gameId,
        cardLocation: CardLocation.BRIBE,
      },
    });

    // Get all selected influence bids for this turn
    const selectedBids = await this.influenceBidService.listExecutiveInfluenceBids({
      where: {
        executiveGameTurnId: gameTurnId,
        isSelected: true,
      },
    });

    // Get player IDs who have selected bids (their bribe cards were taken)
    const playersWithSelectedBids = new Set(
      selectedBids.map((bid) => bid.toPlayerId),
    );

    // Find bribe cards that were NOT bid on (not selected)
    const unbiddedBribeCards = allBribeCards.filter(
      (card) => card.playerId && !playersWithSelectedBids.has(card.playerId),
    );

    if (unbiddedBribeCards.length > 0) {
      console.log(
        `[startTrick] Game ${gameId}: Discarding ${unbiddedBribeCards.length} unbidded bribe cards`,
      );

      // Move unbidded bribe cards to DISCARD
      const unbiddedCardIds = unbiddedBribeCards.map((card) => card.id);
      await this.prisma.executiveCard.updateMany({
        where: {
          id: { in: unbiddedCardIds },
        },
        data: {
          cardLocation: CardLocation.DISCARD,
          playerId: null,
        },
      });

      // Update cache
      const cachedCards = this.cardService['cardCache']?.get(gameId);
      if (cachedCards) {
        unbiddedCardIds.forEach((cardId) => {
          const card = cachedCards.find((c) => c.id === cardId);
          if (card) {
            card.cardLocation = CardLocation.DISCARD;
            card.playerId = null;
          }
        });
      }
    }

    //create the trick
    await this.prisma.executiveTrick.create({
      data: {
        game: { connect: { id: gameId } },
        turn: { connect: { id: gameTurnId } },
      },
    });
  }

  getAgendaDescription(agendaType: Agenda) {
    switch (agendaType) {
      case Agenda.BECOME_CEO_NO_SHARE:
        return 'Become CEO without sharing the position.';
      case Agenda.FOREIGN_INVESTOR_CEO:
        return 'Foreign Investor must become CEO.';
      case Agenda.BECOME_CEO_WITH_FOREIGN_INVESTOR:
        return 'Become co-CEO along with the Foreign Investor.';
      case Agenda.CEO_THREE_PLAYERS:
        return 'Amongst the Foreign Investor and Players, three must become co-CEO.';
      case Agenda.FIRST_LEFT_CEO:
        return 'The player to the left of you must become CEO.';
      case Agenda.SECOND_LEFT_CEO:
        return 'The player two to the left of you must become CEO.';
      case Agenda.THIRD_LEFT_CEO:
        return 'The player three to the left of you must become CEO.';
      default:
        return 'Unknown Agenda';
    }
  }

  // Utility function to shuffle the array (Fisher-Yates shuffle)
  shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  async createExecutiveAgendas(gameId: string, players: ExecutivePlayer[]) {
    const agendaOrder = [
      Agenda.BECOME_CEO_NO_SHARE,
      Agenda.FOREIGN_INVESTOR_CEO,
      Agenda.BECOME_CEO_WITH_FOREIGN_INVESTOR,
      Agenda.CEO_THREE_PLAYERS,
      Agenda.FIRST_LEFT_CEO,
      Agenda.SECOND_LEFT_CEO,
      Agenda.THIRD_LEFT_CEO,
    ];

    // Shuffle the players to randomize the order
    const shuffledPlayers = this.shuffleArray(players);

    // Limit the agenda types to the number of players
    const agendasToAssign = agendaOrder.slice(0, shuffledPlayers.length);

    // Create agenda data
    const agendaData = agendasToAssign.map((agendaType, index) => ({
      gameId,
      agendaType,
      description: this.getAgendaDescription(agendaType),
      playerId: shuffledPlayers[index].id,
    }));

    // Create executive agendas in the database
    await this.prisma.executiveAgenda.createMany({
      data: agendaData,
    });
  }

  async startGame(roomId: number, gameName: string) {
    //create the game
    const game = await this.gameService.createExecutiveGame({
      name: gameName,
      Room: { connect: { id: roomId } },
      gameStatus: ExecutiveGameStatus.ACTIVE,
    });
    //add players to the game
    const players = await this.addPlayersToGame(game.id, roomId);

    //create influence
    const playerInfluence = players.flatMap((player) =>
      Array.from({ length: INFLUENCE_PLAYER_STARTING }).map(() => ({
        gameId: game.id,
        selfPlayerId: player.id,
        ownedByPlayerId: player.id,
        influenceType: InfluenceType.PLAYER,
        influenceLocation: InfluenceLocation.OF_PLAYER,
      })),
    );
    const ceoInfluence = Array.from({ length: INFLUENCE_CEO_STARTING }).map(
      () => ({
        gameId: game.id,
        influenceType: InfluenceType.CEO,
        influenceLocation: InfluenceLocation.CEO,
      }),
    );
    // Create influence for players
    await this.influenceService.createManyInfluence([
      ...playerInfluence,
      ...ceoInfluence,
    ]);

    //create agends
    await this.createExecutiveAgendas(game.id, players);

    //create the cards and add them to the deck
    await this.cardService.createDeck(game.id);

    //create turn 1
    const turn = await this.prisma.executiveGameTurn.create({
      data: {
        game: { connect: { id: game.id } },
        turnNumber: 1,
        turnType: TurnType.TRICK,
      },
    });

    //set cache data
    const currentCache = this.gameCache.get(game.id);
    this.gameCache.set(game.id, {
      ...currentCache,
      players,
    });
    await this.startPhase({
      gameId: game.id,
      gameTurnId: turn.id,
      phaseName: ExecutivePhaseName.START_GAME,
    });

    this.pusher.trigger(
      getRoomChannelId(roomId),
      EVENT_EXECUTIVE_GAME_STARTED,
      { gameId: game.id },
    );
  }

  getCardHandSizeForTurn(turnNumber: number) {
    switch (turnNumber) {
      case 1:
        return ROUND_1_CARD_HAND_SIZE;
      case 2:
        return ROUND_2_CARD_HAND_SIZE;
      case 3:
        return ROUND_3_CARD_HAND_SIZE;
      case 4:
        return ROUND_4_CARD_HAND_SIZE;
      default:
        return 0;
    }
  }

  /**
   * Determines the next player for influence bid selection.
   * IMPORTANT: This method moves to the next player in sequence regardless of whether
   * they have bids or not. Players with no bids must explicitly select "Take No Bid"
   * to proceed - they are NOT automatically skipped.
   */
  async determineInfluenceBidSelector(
    gameTurnId: string,
    gameId: string,
    currentPhaseId: string,
  ) {
    let players;
    try {
      players = await this.playerService.listExecutivePlayersNoRelations({
        where: {
          gameId: gameId,
        },
      });
    } catch (error) {
      console.error('error', error);
      throw new Error('Players not found');
    }
    if (!players) {
      console.error('Players not found');
      throw new Error('Players not found');
    }
    //get the previous phase
    let previousPhase;
    try {
      previousPhase = await this.phaseService.getPreviousPhase({
        gameId: gameId,
        gameTurnId: gameTurnId,
        phaseName: ExecutivePhaseName.INFLUENCE_BID_SELECTION,
      });
    } catch (error) {
      console.error('error', error);
      throw new Error('Previous phase not found');
    }
    let nextPlayer: ExecutivePlayer | null = null;
    //if there is no previous phase, the COO is the first player
    if (!previousPhase) {
      try {
        //get the COO player
        nextPlayer = await this.playerService.findExecutivePlayer({
          gameId: gameId,
          isCOO: true,
        });
      } catch (error) {
        console.error('error', error);
        throw new Error('COO not found');
      }
      if (!nextPlayer) {
        throw new Error('COO not found');
      }
      try {
        //update the phase - NOTE: We do NOT check if player has bids.
        //Players with no bids must explicitly select "Take No Bid"
        return await this.phaseService.updateExecutivePhase({
          where: { id: currentPhaseId },
          data: {
            player: { connect: { id: nextPlayer.id } },
          },
        });
      } catch (error) {
        console.error('error', error);
        throw new Error('Phase not found');
      }
    } else {
      //otherwise, the next player is the player to the left of the previous player
      //NOTE: We move to the next player in sequence regardless of whether they have bids.
      //Players with no bids will need to select "Take No Bid" to proceed.
      if (!previousPhase.activePlayerId) {
        throw new Error('Active player not found');
      }
      //get the player
      let previousPlayer;
      try {
        previousPlayer = await this.playerService.getExecutivePlayerNoRelations(
          {
            id: previousPhase?.activePlayerId,
          },
        );
      } catch (error) {
        console.error('error', error);
        throw new Error('Previous player not found');
      }
      if (!previousPlayer) {
        throw new Error('Previous player not found');
      }
      try {
        //get the next player in sequence (regardless of whether they have bids)
        nextPlayer = this.findNewActivePlayer(previousPlayer, players);
      } catch (error) {
        console.error('error', error);
        throw new Error('Next player not found');
      }
      if (nextPlayer.isCOO) {
        try {
          //we have gone around the table and the bidding selection is done, move to trick taking
          await this.startPhase({
            gameId: gameId,
            gameTurnId: gameTurnId,
            phaseName: ExecutivePhaseName.START_TRICK,
          });
        } catch (error) {
          console.error('error', error);
          throw new Error('Next phase not found');
        }
      } else {
        if (!nextPlayer) {
          throw new Error('Next player not found');
        }
        try {
          //update the phase - NOTE: We do NOT check if player has bids.
          //Players with no bids must explicitly select "Take No Bid"
          return await this.phaseService.updateExecutivePhase({
            where: { id: currentPhaseId },
            data: {
              player: { connect: { id: nextPlayer.id } },
            },
          });
        } catch (error) {
          console.error('error', error);
          throw new Error('Phase not found');
        }
      }
    }
  }
  async determineInfluenceBidder(
    gameId: string,
    gameTurnId: string,
    currentPhaseId: string,
  ) {
    //find all players
    const players = await this.playerService.listExecutivePlayersNoRelations({
      where: {
        gameId,
      },
    });
    //find the general counsel
    const generalCounsel = players.find((player) => player.isGeneralCounsel);
    if (!generalCounsel) {
      throw new Error('General Counsel not found');
    }
    //get the previous phase
    const previousPhase = await this.phaseService.getPreviousPhase({
      gameId,
      gameTurnId,
      phaseName: ExecutivePhaseName.INFLUENCE_BID,
    });
    //get player id of previous phase
    const previousPlayerId = previousPhase?.activePlayerId;
    if (!previousPlayerId) {
      //update the phase
      await this.phaseService.updateExecutivePhase({
        where: { id: currentPhaseId },
        data: {
          player: { connect: { id: generalCounsel.id } },
        },
      });
    } else {
      //the new active player is to the left of tableIndex
      const previousPlayer = players.find(
        (player) => player.id === previousPlayerId,
      );
      if (!previousPlayer) {
        throw new Error('Previous player not found');
      }
      const newActivePlayer = await this.findNewActivePlayerPassStrategy(
        previousPlayer,
        players,
        gameTurnId,
      );

      //update the phase
      await this.phaseService.updateExecutivePhase({
        where: { id: currentPhaseId },
        data: {
          player: { connect: { id: newActivePlayer.id } },
        },
      });
    }
  }

  async findNewActivePlayerPassStrategy(
    previousPlayer: ExecutivePlayer,
    players: ExecutivePlayer[],
    gameTurnId: string,
    checkedPlayers: Set<string> = new Set(),
  ): Promise<ExecutivePlayer> {
    const newActivePlayerSeatIndex =
      previousPlayer.seatIndex + 1 >= players.length
        ? 0
        : previousPlayer.seatIndex + 1;
    const newActivePlayer = players.find(
      (player) => player.seatIndex === newActivePlayerSeatIndex,
    );

    if (!newActivePlayer) {
      throw new Error('New active player not found');
    }

    // If we've already checked this player, return an error to prevent infinite recursion
    if (checkedPlayers.has(newActivePlayer.id)) {
      throw new Error('All players have passed');
    }

    // Mark the player as checked
    checkedPlayers.add(newActivePlayer.id);

    // Check if the new active player has passed this turn
    const playerPass = await this.prisma.executivePlayerPass.findFirst({
      where: {
        gameTurnId,
        playerId: newActivePlayer.id,
      },
    });

    // Recursively find the next player if the current player has passed
    if (playerPass) {
      return this.findNewActivePlayerPassStrategy(
        newActivePlayer,
        players,
        gameTurnId,
        checkedPlayers,
      );
    }

    return newActivePlayer;
  }

  async resolveMoveCOOAndGeneralCounsel(gameId: string) {
    //get game players
    const players = await this.playerService.listExecutivePlayersNoRelations({
      where: {
        gameId,
      },
    });
    //find the player the coo
    let coo = players.find((player) => player.isCOO);
    if (!coo) {
      //assign coo to a random player
      const randomIndex = Math.floor(Math.random() * players.length);
      coo = await this.playerService.updateExecutivePlayer({
        where: { id: players[randomIndex].id },
        data: {
          isCOO: true,
        },
      });
    }
    //find the player with the general counsel
    const generalCounsel = players.find((player) => player.isGeneralCounsel);
    if (generalCounsel) {
      //remove general counsel from player
      await this.playerService.updateExecutivePlayer({
        where: { id: generalCounsel.id },
        data: {
          isGeneralCounsel: false,
        },
      });
    }
    //place general counsel to the left of the coo
    const cooSeatIndex = coo.seatIndex;
    const generalCounselSeatIndex =
      cooSeatIndex + 1 >= players.length ? 0 : cooSeatIndex + 1;
    const nextGeneralCounselPlayer = players.find(
      (player) => player.seatIndex === generalCounselSeatIndex,
    );
    if (!nextGeneralCounselPlayer) {
      throw new Error('General Counsel not found');
    }
    await this.playerService.updateExecutivePlayer({
      where: { id: nextGeneralCounselPlayer.id },
      data: {
        isGeneralCounsel: true,
      },
    });
  }

  async startPhase({
    gameId,
    gameTurnId,
    phaseName,
    activePlayerId,
    executiveTrickId,
  }: {
    gameId: string;
    gameTurnId: string;
    phaseName: ExecutivePhaseName;
    activePlayerId?: string;
    executiveTrickId?: string;
  }) {
    //create the phase
    const phase = await this.phaseService.createExecutivePhase({
      game: { connect: { id: gameId } },
      gameTurn: { connect: { id: gameTurnId } },
      phaseName,
      player: activePlayerId ? { connect: { id: activePlayerId } } : undefined,
    });
    const currentCache = this.gameCache.get(gameId);
    this.gameCache.set(gameId, {
      ...currentCache,
      currentPhase: phase,
    });
    const gameTurn =
      await this.gameTurnService.getLatestTurnNoRelations(gameId);
    if (!gameTurn) {
      throw new Error('Game turn not found');
    }
    await this.resolvePhase({
      gameTurn,
      phaseName: phase.phaseName,
      activePlayerId,
      phaseId: phase.id,
    });
    this.pusher.trigger(getGameChannelId(gameId), EVENT_EXECUTIVE_NEW_PHASE, {
      phaseName,
    });
    return phase;
  }

  async nextPhase(
    gameId: string,
    gameTurnId: string,
    currentPhaseName: ExecutivePhaseName,
  ) {
    const newPhaseName =
      this.determineNextExecutivePhaseTrick(currentPhaseName);
    if (!newPhaseName) {
      throw new Error('Next phase not found');
    }
    await this.startPhase({ gameId, gameTurnId, phaseName: newPhaseName });
  }

  async submitInfluenceBidLegacy(
    gameId: string,
    playerIdFrom: string,
    playerIdTo: string,
    influenceCount: number,
  ) {
    //throw error if player is sending to self
    if (playerIdFrom === playerIdTo) {
      throw new Error('Cannot send influence to self');
    }
    //get the local cache
    const currentCache = this.gameCache.get(gameId);

    //get game turn
    const gameTurnId = await this.gameTurnService.getLatestTurnId(gameId);
    if (!gameTurnId) {
      throw new Error('Game turn not found');
    }
    // get the players influence
    const playerFrom = await this.playerService.getExecutivePlayer({
      id: playerIdFrom,
    });
    if (!playerFrom) {
      throw new Error('Player not found');
    }
    const selfInfluenceOwned = playerFrom.ownedByInfluence.filter(
      (influence) => influence.selfPlayerId === playerIdFrom,
    );
    //if influence is less than the bid, throw an error
    if (selfInfluenceOwned.length < influenceCount) {
      throw new Error('Not enough influence to bid');
    }

    const playerTo =
      currentCache?.players?.find((player) => player.id === playerIdTo) ??
      (await this.playerService.getExecutivePlayer({
        id: playerIdTo,
      }));

    if (!playerTo) {
      throw new Error('Player not found');
    }
    //get influence from count
    const influence = selfInfluenceOwned.slice(0, influenceCount);

    //add influence to player bid
    return this.influenceBidService.createExecutiveInfluenceBid(
      {
        game: { connect: { id: gameId } },
        ExecutiveGameTurn: { connect: { id: gameTurnId } },
        toPlayer: { connect: { id: playerIdTo } },
        fromPlayer: { connect: { id: playerIdFrom } },
      },
      influence,
    );
  }

  async submitInfluenceBid(
    gameId: string,
    playerIdFrom: string,
    playerIdTo: string,
    influenceIds: string[],
  ) {
    //throw error if player is sending to self
    if (playerIdFrom === playerIdTo) {
      throw new Error('Cannot send influence to self');
    }
    //get the local cache
    const currentCache = this.gameCache.get(gameId);

    //get game turn
    const gameTurnId = await this.gameTurnService.getLatestTurnId(gameId);
    if (!gameTurnId) {
      throw new Error('Game turn not found');
    }
    // get the players influence
    const playerFrom = await this.playerService.getExecutivePlayer({
      id: playerIdFrom,
    });
    if (!playerFrom) {
      throw new Error('Player not found');
    }

    const playerTo =
      currentCache?.players?.find((player) => player.id === playerIdTo) ??
      (await this.playerService.getExecutivePlayer({
        id: playerIdTo,
      }));

    if (!playerTo) {
      throw new Error('Player not found');
    }

    //get all influce from ids
    const influence = await this.influenceService.listInfluences({
      where: {
        id: {
          in: influenceIds,
        },
      },
    });

    if (
      influence.some((influence) => influence.ownedByPlayerId !== playerIdFrom)
    ) {
      throw new Error('Influence not owned by player');
    }

    //add influence to player bid
    return this.influenceBidService.createExecutiveInfluenceBid(
      {
        game: { connect: { id: gameId } },
        ExecutiveGameTurn: { connect: { id: gameTurnId } },
        toPlayer: { connect: { id: playerIdTo } },
        fromPlayer: { connect: { id: playerIdFrom } },
      },
      influence,
    );
  }

  async playCardIntoTrick(
    cardId: string,
    playerId: string,
    gameId: string,
    gameTurnId: string,
  ) {
    /**
     * 1. Set up a numeric timestamp (instead of .toISOString())
     *    so we can easily measure elapsed time in milliseconds.
     */
    const startTime = Date.now();

    // Helper function to log the elapsed time from the start
    function logStep(stepName: string, previousTime?: number) {
      const now = Date.now();
      const totalElapsed = now - startTime;
      if (previousTime !== undefined) {
        const stepElapsed = now - previousTime;
        console.log(
          `[playCardIntoTrick] ${stepName} | step: ${stepElapsed} ms, total: ${totalElapsed} ms`,
        );
      } else {
        console.log(
          `[playCardIntoTrick] ${stepName} | total: ${totalElapsed} ms`,
        );
      }
      return now; // return 'now' so we can track step-by-step if desired
    }

    let stepStart = startTime;
    logStep('START'); // e.g. "START | total: 0 ms"

    // 2. Fetch the needed data in parallel
    const [trick, card, player, existingTrickCard] = await Promise.all([
      this.prisma.executiveTrick.findFirst({
        where: { turnId: gameTurnId },
        include: {
          trickCards: { include: { card: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.cardService.getExecutiveCard({ id: cardId }),
      this.playerService.getExecutivePlayerWithCards({ id: playerId }),
      // Check if card has already been played in any trick
      this.prisma.trickCard.findFirst({
        where: { cardId },
      }),
    ]);

    stepStart = logStep('Data fetched', stepStart);

    if (!trick) throw new Error('Trick not found');
    if (!card) throw new Error('Card not found');
    if (!player) throw new Error('Player not found');

    // VALIDATION: Check if trick has already been resolved
    if (trick.trickWinnerId) {
      throw new Error('Trick has already been resolved');
    }

    // VALIDATION: Check if card has already been played (already in a trick)
    if (existingTrickCard) {
      throw new Error('Card has already been played in a trick');
    }

    // VALIDATION: Check if card is in player's hand or gift
    if (card.cardLocation !== CardLocation.HAND && card.cardLocation !== CardLocation.GIFT) {
      throw new Error(`Card is not in player's hand or gift. Current location: ${card.cardLocation}`);
    }

    // VALIDATION: Check if card belongs to the player
    if (card.playerId !== playerId) {
      throw new Error('Card does not belong to this player');
    }

    // VALIDATION: Check if player has already played a card in this trick
    const playerHasPlayedInTrick = trick.trickCards.some(
      (tc) => tc.playerId === playerId,
    );
    if (playerHasPlayedInTrick) {
      throw new Error('Player has already played a card in this trick');
    }

    // VALIDATION: Check if it's the player's turn
    const currentPhase = await this.phaseService.getCurrentExecutivePhase({
      gameId,
    });
    if (!currentPhase) {
      throw new Error('No active phase found');
    }

    if (currentPhase.phaseName !== ExecutivePhaseName.SELECT_TRICK) {
      throw new Error(`Cannot play card in phase: ${currentPhase.phaseName}`);
    }

    if (currentPhase.activePlayerId !== playerId) {
      throw new Error('It is not this player\'s turn to play a card');
    }

    // VALIDATION: Check if the trick matches the current phase's trick
    if (currentPhase.executiveTrickId && currentPhase.executiveTrickId !== trick.id) {
      throw new Error('Trick does not match the current phase');
    }

    stepStart = logStep('Validations complete', stepStart);

    // 3. Update the card
    await this.cardService.updateExecutiveCard({
      where: { id: cardId },
      data: { cardLocation: CardLocation.TRICK },
    });
    stepStart = logStep('Card updated', stepStart);

    // 4. Create the TrickCard
    await this.prisma.trickCard.create({
      data: {
        trick: { connect: { id: trick.id } },
        card: { connect: { id: cardId } },
        player: { connect: { id: playerId } },
        isLead: !!!trick.trickCards.find((tc) => tc.isLead),
        gameTurnId,
      },
    });
    stepStart = logStep('TrickCard created', stepStart);

    // 5. Gather players
    const players = await this.playerService.listExecutivePlayersNoRelations({
      where: { gameId: player.gameId },
    });
    if (!players) throw new Error('Players not found');
    stepStart = logStep('Players fetched', stepStart);

    // 6. Determine next player
    const nextPlayer = await this.findNewActivePlayer(player, players);
    if (!nextPlayer) throw new Error('Next player not found');
    stepStart = logStep('Next player determined', stepStart);

    // 7. Either resolve the trick or move on
    if (nextPlayer.isCOO) {
      return await this.startPhase({
        gameId: player.gameId,
        gameTurnId,
        phaseName: ExecutivePhaseName.RESOLVE_TRICK,
      });
    } else {
      return await this.startPhase({
        gameId: player.gameId,
        gameTurnId,
        phaseName: ExecutivePhaseName.SELECT_TRICK,
        activePlayerId: nextPlayer.id,
        executiveTrickId: trick.id,
      });
    }
  }

  async resolveTrickWinner(gameTurnId: string, gameId: string) {
    // 1. Set up a numeric timestamp at the start.
    const startTime = Date.now();

    // Helper function to log the elapsed time
    function logStep(stepName: string, prevTime?: number): number {
      const now = Date.now();
      const totalElapsed = now - startTime;
      if (prevTime !== undefined) {
        const stepElapsed = now - prevTime;
        console.log(
          `[resolveTrickWinner] ${stepName} | step: ${stepElapsed} ms, total: ${totalElapsed} ms`,
        );
      } else {
        console.log(
          `[resolveTrickWinner] ${stepName} | total: ${totalElapsed} ms`,
        );
      }
      return now; // Return current time to chain subsequent measurements
    }

    let stepStart = startTime;
    logStep('START'); // e.g. "START | total: 0 ms"

    // 2. Fetch data in parallel
    const [executiveTrick, ceoInfluence] = await Promise.all([
      this.prisma.executiveTrick.findFirst({
        where: { turnId: gameTurnId },
        orderBy: { createdAt: 'desc' },
        include: {
          trickCards: { include: { card: true } },
        },
      }),
      this.influenceService.listInfluences({
        where: {
          gameId: gameId,
          influenceType: InfluenceType.CEO,
          influenceLocation: InfluenceLocation.CEO,
        },
        take: 1,
      }),
    ]);
    stepStart = logStep('Data fetched', stepStart);

    // 3. Validations
    if (!executiveTrick) throw new Error('Trick not found');
    if (!ceoInfluence) throw new Error('CEO influence not found');
    // e.g. "Lead card," "Trump card" checks
    const leadCard = executiveTrick.trickCards.find((tc) => tc.isLead);
    if (!leadCard) throw new Error('Lead card suit not found');

    const cache = this.gameCache.get(gameId);
    const trumpCard =
      cache?.currentTrumpCard ??
      (await this.cardService.findExecutiveCard({
        gameId: executiveTrick.gameId,
        cardLocation: CardLocation.TRUMP,
      }));
    if (!trumpCard) throw new Error('Trump card suit not found');

    stepStart = logStep('Validation complete', stepStart);

    // 4. Determine the trick leader
    const trickCardsNoTrump = executiveTrick.trickCards.filter(
      (tc) => !tc.isTrump,
    );
    const trickLeader = this.getTrickLeader(
      trickCardsNoTrump.map((tc) => tc.card),
      leadCard.card.cardSuit,
      trumpCard.cardSuit,
    );
    if (!trickLeader.playerId) {
      throw new Error('Trick leader not found');
    }

    stepStart = logStep('Trick leader determined', stepStart);

    // 5-7. Update all database operations in parallel for better performance
    try {
      await Promise.all([
        // Update the CEO influence to the trick-winner
        this.influenceService.updateInfluence({
          where: { id: ceoInfluence[0].id },
          data: {
            ownedByPlayer: { connect: { id: trickLeader.playerId } },
            influenceLocation: InfluenceLocation.OWNED_BY_PLAYER,
          },
        }),
        // Update the trick winner
        this.prisma.executiveTrick.update({
          where: { id: executiveTrick.id },
          data: { trickWinnerId: trickLeader.playerId },
        }),
        // Remove COO from everyone
        this.playerService.updateManyExecutivePlayers({
          where: { gameId: executiveTrick.gameId },
          data: { isCOO: false },
        }),
        // Set the winner as COO
        this.playerService.updateExecutivePlayer({
          where: { id: trickLeader.playerId },
          data: { isCOO: true },
        }),
      ]);
    } catch (error) {
      console.error('[resolveTrickWinner] Error updating database', error);
      throw new Error('Database update failed');
    }
    stepStart = logStep('All updates completed', stepStart);

    // 8. Update the local cache - refresh players from database to ensure COO is updated
    const gameCache = this.gameCache.get(gameId);
    // Always refresh players from database after COO update to ensure consistency
    const players = await this.playerService.listExecutivePlayersNoRelations({
      where: { gameId },
    });
    if (!players) throw new Error('Players not found');

    // Verify the COO was set correctly in the database
    const cooPlayer = players.find((p) => p.isCOO);
    if (!cooPlayer || cooPlayer.id !== trickLeader.playerId) {
      console.error(
        `[resolveTrickWinner] COO mismatch: expected ${trickLeader.playerId}, found ${cooPlayer?.id || 'none'}`,
      );
      // This shouldn't happen, but log it for debugging
    }

    this.gameCache.set(gameId, {
      ...gameCache,
      players: players.map((p) => ({
        ...p,
        isCOO: p.id === trickLeader.playerId,
      })),
    });
    stepStart = logStep('Local cache updated', stepStart);

    // Done
    logStep('END', stepStart);
  }

  getTrickLeader(
    cards: ExecutiveCard[],
    leadCardSuit: CardSuit,
    trumpCardSuit: CardSuit,
  ): ExecutiveCard {
    // Separate cards by trump suit and lead suit
    const trumpCards = cards.filter((card) => card.cardSuit === trumpCardSuit);
    const leadSuitCards = cards.filter(
      (card) => card.cardSuit === leadCardSuit,
    );

    // Sort trump and lead suit cards by card value
    const sortedTrumpCards = trumpCards.sort(
      (a, b) => b.cardValue - a.cardValue,
    );
    const sortedLeadSuitCards = leadSuitCards.sort(
      (a, b) => b.cardValue - a.cardValue,
    );

    // Determine the trick leader
    if (sortedTrumpCards.length > 0) {
      // If there are trump cards, the highest trump card wins
      return sortedTrumpCards[0];
    } else if (sortedLeadSuitCards.length > 0) {
      // If there are no trump cards, the highest lead suit card wins
      return sortedLeadSuitCards[0];
    } else {
      // If no trump or lead suit cards, return the highest card of any suit
      const sortedCards = cards.sort((a, b) => b.cardValue - a.cardValue);
      return sortedCards[0];
    }
  }

  async dealCards(gameId: string, handSize: number) {
    const gameCache = this.gameCache.get(gameId);
    const players =
      gameCache?.players ??
      (await this.playerService.listExecutivePlayersNoRelations({
        where: {
          gameId,
        },
      }));
    
    if (!players || players.length === 0) {
      throw new Error(`No players found for game ${gameId}`);
    }
    
    if (handSize <= 0) {
      throw new Error(`Invalid hand size: ${handSize} for game ${gameId}`);
    }
    
    // IMPORTANT: Clear any existing BRIBE cards before dealing new ones
    // This ensures players never have more than one bribe card per turn
    // NOTE: Existing bribe cards should have been discarded in startTrick,
    // but we clear any remaining ones here as a safety measure
    const existingBribeCards = await this.cardService.listExecutiveCards({
      where: {
        gameId,
        cardLocation: CardLocation.BRIBE,
      },
    });
    
    if (existingBribeCards.length > 0) {
      console.log(`[dealCards] Game ${gameId}: Discarding ${existingBribeCards.length} existing bribe cards before dealing new ones`);
      // Discard existing bribe cards (they should have been discarded in startTrick, but clear any remaining)
      const bribeCardIds = existingBribeCards.map((card) => card.id);
      await this.prisma.executiveCard.updateMany({
        where: {
          id: { in: bribeCardIds },
        },
        data: {
          cardLocation: CardLocation.DISCARD,
          playerId: null,
        },
      });
      
      // Update cache
      const cachedCards = this.cardService['cardCache']?.get(gameId);
      if (cachedCards) {
        bribeCardIds.forEach((cardId) => {
          const card = cachedCards.find((c) => c.id === cardId);
          if (card) {
            card.cardLocation = CardLocation.DISCARD;
            card.playerId = null;
          }
        });
      }
    }
    
    // Draw enough cards for both hands and bribes for each player
    const totalCardsNeeded =
      players.length * handSize + players.length * BRIBE_CARD_HAND_SIZE;
    
    console.log(`[dealCards] Game ${gameId}: Dealing ${handSize} hand cards + ${BRIBE_CARD_HAND_SIZE} bribe card to ${players.length} players (${totalCardsNeeded} total cards)`);
    
    const cards = await this.cardService.drawCards(gameId, totalCardsNeeded);
    
    if (cards.length !== totalCardsNeeded) {
      throw new Error(`Expected ${totalCardsNeeded} cards but got ${cards.length}`);
    }

    // Divide cards into hands and bribes
    const handCards = cards.slice(0, players.length * handSize);
    const bribeCards = cards.slice(players.length * handSize);
    
    // Batch update all cards at once instead of per-player sequential updates
    const cardUpdates: Array<{ id: string; cardLocation: CardLocation; playerId: string }> = [];
    
    for (let i = 0; i < players.length; i++) {
      const playerId = players[i].id;

      // Get hand and bribe cards for the current player
      const playerHandCards = handCards.slice(i * handSize, (i + 1) * handSize);
      const playerBribeCards = bribeCards.slice(
        i * BRIBE_CARD_HAND_SIZE,
        (i + 1) * BRIBE_CARD_HAND_SIZE,
      );
      
      if (playerHandCards.length !== handSize) {
        throw new Error(`Player ${playerId} (index ${i}): Expected ${handSize} hand cards but got ${playerHandCards.length}`);
      }
      
      if (playerBribeCards.length !== BRIBE_CARD_HAND_SIZE) {
        throw new Error(`Player ${playerId} (index ${i}): Expected ${BRIBE_CARD_HAND_SIZE} bribe cards but got ${playerBribeCards.length}`);
      }
      
      // Collect all card updates
      playerHandCards.forEach((card) => {
        cardUpdates.push({
          id: card.id,
          cardLocation: CardLocation.HAND,
          playerId,
        });
      });
      
      playerBribeCards.forEach((card) => {
        cardUpdates.push({
          id: card.id,
          cardLocation: CardLocation.BRIBE,
          playerId,
        });
      });
    }
    
    if (cardUpdates.length !== totalCardsNeeded) {
      throw new Error(`Expected ${totalCardsNeeded} card updates but prepared ${cardUpdates.length}`);
    }
    
    // Execute all card updates in parallel batches
    // Use cardService.updateExecutiveCard to ensure cache is updated
    const updatePromises = cardUpdates.map((update) =>
      this.cardService.updateExecutiveCard({
        where: { id: update.id },
        data: {
          cardLocation: update.cardLocation,
          player: { connect: { id: update.playerId } },
        },
      })
    );
    
    const updateResults = await Promise.all(updatePromises);
    console.log(`[dealCards] Game ${gameId}: Successfully updated ${updateResults.length} cards`);
    
    // VALIDATION: Verify each player has exactly one bribe card
    for (const player of players) {
      const playerBribeCards = await this.cardService.listExecutiveCards({
        where: {
          gameId,
          playerId: player.id,
          cardLocation: CardLocation.BRIBE,
        },
      });
      
      if (playerBribeCards.length > 1) {
        console.error(`[dealCards] ERROR: Player ${player.id} has ${playerBribeCards.length} bribe cards! Expected 1.`);
        // Move extra bribe cards back to deck
        const extraCards = playerBribeCards.slice(1);
        const extraCardIds = extraCards.map((card) => card.id);
        await this.prisma.executiveCard.updateMany({
          where: {
            id: { in: extraCardIds },
          },
          data: {
            cardLocation: CardLocation.DECK,
            playerId: null,
          },
        });
        
        // Update cache
        const cachedCards = this.cardService['cardCache']?.get(gameId);
        if (cachedCards) {
          extraCardIds.forEach((cardId) => {
            const card = cachedCards.find((c) => c.id === cardId);
            if (card) {
              card.cardLocation = CardLocation.DECK;
              card.playerId = null;
            }
          });
        }
        
        throw new Error(`Player ${player.id} ended up with ${playerBribeCards.length} bribe cards. This should never happen.`);
      }
      
      if (playerBribeCards.length === 0) {
        console.error(`[dealCards] ERROR: Player ${player.id} has no bribe cards! Expected 1.`);
        throw new Error(`Player ${player.id} has no bribe cards after dealing.`);
      }
    }
    
    //take one card from the deck for the trump card
    const trumpCard = await this.cardService.drawCards(gameId, 1);
    //update the trump card
    await this.cardService.updateExecutiveCard({
      where: { id: trumpCard[0].id },
      data: {
        cardLocation: CardLocation.TRUMP,
      },
    });
  }

  async addPlayersToGame(
    gameId: string,
    roomId: number,
  ): Promise<ExecutivePlayer[]> {
    const users = await this.prisma.roomUser.findMany({
      where: {
        roomId,
      },
      include: {
        user: true,
      },
    });

    return await this.playerService.createManyExecutivePlayers(
      users.map((user, index) => ({
        userId: user.userId,
        gameId,
        seatIndex: index,
        nickname: user.user.name,
      })),
    );
  }

  async createExecutiveInfluenceBidFromClientLegacy({
    fromPlayerId,
    toPlayerId,
    influenceAmount,
  }: {
    fromPlayerId: string;
    toPlayerId: string;
    influenceAmount: number;
  }) {
    if (influenceAmount < 1) {
      throw new Error('Influence amount must be greater than 0');
    }
    //get the player
    const fromPlayer = await this.playerService.getExecutivePlayer({
      id: fromPlayerId,
    });
    if (!fromPlayer) {
      throw new Error('From player not found');
    }
    //get the game
    const currentCache = this.gameCache.get(fromPlayer.gameId);
    const gameTurnId =
      currentCache?.currentGameTurnId ??
      (await this.gameTurnService.getLatestTurnId(fromPlayer.gameId));
    if (!gameTurnId) {
      throw new Error('Game turn not found');
    }
    //ensure the player has not already made a bid on this turn
    const existingBid =
      await this.influenceBidService.findExecutiveInfluenceBid({
        fromPlayerId,
        toPlayerId,
        executiveGameTurnId: gameTurnId,
      });
    if (existingBid) {
      throw new Error(
        'Player has already made a bid on this players bribe this turn.',
      );
    }
    //ensure the player has enough influence
    const ownedSelfInfluence = fromPlayer.ownedByInfluence.filter(
      (influence) => influence.selfPlayerId === influence.ownedByPlayerId,
    );
    if (ownedSelfInfluence.length < influenceAmount) {
      throw new Error('Player does not have enough influence');
    }
    //get the player
    const toPlayer = await this.playerService.getExecutivePlayer({
      id: toPlayerId,
    });
    if (!toPlayer) {
      throw new Error('To player not found');
    }
    //create the influence bid
    try {
      await this.influenceBidService.createExecutiveInfluenceBid(
        {
          game: { connect: { id: fromPlayer.gameId } },
          ExecutiveGameTurn: { connect: { id: gameTurnId } },
          toPlayer: { connect: { id: toPlayerId } },
          fromPlayer: { connect: { id: fromPlayerId } },
        },
        ownedSelfInfluence.slice(0, influenceAmount),
      );
    } catch (error) {
      console.error('error', error);
      throw new Error('Influence bid not found');
    }
    try {
      await this.startPhase({
        gameId: fromPlayer.gameId,
        gameTurnId: gameTurnId,
        phaseName: ExecutivePhaseName.INFLUENCE_BID,
      });
    } catch (error) {
      console.error('error', error);
      throw new Error('INFLUENCE_BID phase not started');
    }
  }

  async createExecutiveInfluenceBidFromClient({
    fromPlayerId,
    toPlayerId,
    influenceValues,
  }: {
    fromPlayerId: string;
    toPlayerId: string;
    influenceValues: Record<string, number>; //selfPlayerId: influenceAmount
  }) {
    if (Object.keys(influenceValues).length < 1) {
      throw new Error('Influence amount must be greater than 0');
    }
    //get the player
    const fromPlayer = await this.playerService.getExecutivePlayer({
      id: fromPlayerId,
    });
    if (!fromPlayer) {
      throw new Error('From player not found');
    }
    //get the game
    const currentCache = this.gameCache.get(fromPlayer.gameId);
    const gameTurnId =
      currentCache?.currentGameTurnId ??
      (await this.gameTurnService.getLatestTurnId(fromPlayer.gameId));
    if (!gameTurnId) {
      throw new Error('Game turn not found');
    }
    //ensure the player has not already made a bid on this turn
    const existingBid =
      await this.influenceBidService.findExecutiveInfluenceBid({
        fromPlayerId,
        toPlayerId,
        executiveGameTurnId: gameTurnId,
      });
    if (existingBid) {
      throw new Error(
        'Player has already made a bid on this players bribe this turn.',
      );
    }
    //get the player
    const toPlayer = await this.playerService.getExecutivePlayer({
      id: toPlayerId,
    });
    if (!toPlayer) {
      throw new Error('To player not found');
    }
    console.log(
      'createExecutiveInfluenceBidFromClient influenceIds',
      influenceValues,
    );
    //get all influence from ids
    const influencePromises = Object.keys(influenceValues).map(
      (selfPlayerId) => {
        const count = influenceValues[selfPlayerId];
        if (typeof count !== 'number') {
          throw new Error(`Invalid count for selfPlayerId: ${selfPlayerId}`);
        }

        return this.influenceService.listInfluences({
          where: {
            selfPlayerId,
            ownedByPlayerId: fromPlayerId,
          },
          take: count,
        });
      },
    );
    const influence = (await Promise.all(influencePromises)).flat();
    if (
      influence.some((influence) => influence.ownedByPlayerId !== fromPlayerId)
    ) {
      throw new Error('Influence not owned by player');
    }
    try {
      //add influence to player bid
      await this.influenceBidService.createExecutiveInfluenceBid(
        {
          game: { connect: { id: fromPlayer.gameId } },
          ExecutiveGameTurn: { connect: { id: gameTurnId } },
          toPlayer: { connect: { id: toPlayer?.id } },
          fromPlayer: { connect: { id: fromPlayer?.id } },
        },
        influence,
      );
    } catch (error) {
      console.error('error', error);
      throw new Error('Influence bid not created');
    }

    try {
      await this.startPhase({
        gameId: fromPlayer.gameId,
        gameTurnId: gameTurnId,
        phaseName: ExecutivePhaseName.INFLUENCE_BID,
      });
    } catch (error) {
      console.error('error', error);
      throw new Error('INFLUENCE_BID phase not started');
    }
  }

  async pingPlayers(gameId: string) {
    await this.pusher.trigger(getGameChannelId(gameId), EVENT_PING_PLAYERS, {});
  }

  async playerPass(gameId: string, playerId: string) {
    const currentCache = this.gameCache.get(gameId);
    const players =
      currentCache?.players ??
      (await this.playerService.listExecutivePlayers({
        where: {
          gameId: gameId,
        },
      }));
    if (!players) {
      throw new Error('Players not found');
    }
    const gameTurnId = await this.gameTurnService.getLatestTurnId(gameId);
    if (!gameTurnId) {
      throw new Error('Game turn not found');
    }
    const currentPhase =
      currentCache?.currentPhase ??
      (await this.phaseService.getCurrentPhase(gameId));
    //ensure player has not already passed
    const existingPass = await this.prisma.executivePlayerPass.findFirst({
      where: {
        playerId,
        gameTurnId: gameTurnId,
      },
    });
    if (existingPass) {
      throw new Error('Player has already passed');
    }
    //create player pass
    const pass = await this.prisma.executivePlayerPass.create({
      data: {
        player: { connect: { id: playerId } },
        gameTurn: { connect: { id: gameTurnId } },
      },
    });
    const playerPasses = await this.prisma.executivePlayerPass.findMany({
      where: {
        gameTurnId: gameTurnId,
      },
    });
    if (playerPasses.length === players.length) {
      let nextPhase: ExecutivePhaseName | null = null;
      if (currentPhase?.phaseName === ExecutivePhaseName.INFLUENCE_BID) {
        nextPhase = ExecutivePhaseName.INFLUENCE_BID_SELECTION;
      } else if (currentPhase?.phaseName === ExecutivePhaseName.SELECT_TRICK) {
        nextPhase = ExecutivePhaseName.RESOLVE_TRICK;
      }
      if (!nextPhase) {
        throw new Error('Next phase not found');
      }
      //if all players have passed, move to the next phase
      await this.startPhase({
        gameId: gameId,
        gameTurnId: gameTurnId,
        phaseName: nextPhase,
      });
    } else {
      await this.startPhase({
        gameId: gameId,
        gameTurnId: gameTurnId,
        phaseName: ExecutivePhaseName.INFLUENCE_BID,
      });
    }
  }

  findNewActivePlayer(
    previousPlayer: ExecutivePlayer,
    players: ExecutivePlayer[],
  ): ExecutivePlayer {
    const newActivePlayerSeatIndex =
      previousPlayer.seatIndex + 1 >= players.length
        ? 0
        : previousPlayer.seatIndex + 1;
    const newActivePlayer = players.find(
      (player) => player.seatIndex === newActivePlayerSeatIndex,
    );
    if (!newActivePlayer) {
      throw new Error('New active player not found');
    }
    return newActivePlayer;
  }

  async createPlayerVote(
    influenceIds: string[],
    playerId: string,
  ): Promise<ExecutiveInfluenceVoteRound> {
    //get the player
    const player = await this.playerService.getExecutivePlayerNoRelations({
      id: playerId,
    });
    if (!player) {
      throw new Error('Player not found');
    }
    //get the current vote round
    const currentVoteRound =
      await this.influenceVoteRoundService.findLatestVoteRound({
        gameId: player.gameId,
      });
    if (!currentVoteRound) {
      throw new Error('Vote round not found');
    }
    //if player has already voted, throw an error
    if (
      currentVoteRound.playerVotes.some((vote) => vote.playerId === playerId)
    ) {
      throw new Error('Player has already voted');
    }
    //get the influence
    const influences = await this.influenceService.listInfluences({
      where: {
        id: { in: influenceIds },
        ownedByPlayerId: playerId,
      },
    });
    if (!influences) {
      throw new Error('Influences not found');
    }
    //ensure all influence is of the same selfPlayerId or type CEO
    const firstSelfPlayerId = influences.find(
      (influence) => influence.selfPlayerId,
    )?.selfPlayerId;

    // Check if all influences are either CEO or have the same selfPlayerId
    const isAllCeoOrSamePlayerId = influences.every(
      (influence) =>
        influence.influenceType === InfluenceType.CEO ||
        (firstSelfPlayerId && influence.selfPlayerId === firstSelfPlayerId),
    );

    if (!isAllCeoOrSamePlayerId) {
      throw new Error(
        'All influence must be of type CEO or have the same selfPlayerId',
      );
    }
    //create the player vote
    await this.prisma.executivePlayerVote.create({
      data: {
        player: { connect: { id: playerId } },
        influence: { connect: influenceIds.map((id) => ({ id })) },
        influenceVoteRound: { connect: { id: currentVoteRound.id } },
      },
    });
    //remove the influence from the player
    const influencePromises = influences.map((influence) => {
      return this.influenceService.updateInfluence({
        where: { id: influence.id },
        data: {
          ownedByPlayer: { disconnect: true },
          influenceLocation: InfluenceLocation.VOTE,
        },
      });
    });
    try {
      await Promise.all(influencePromises);
    } catch (error) {
      console.error('error', error);
      throw new Error('Influence not found');
    }
    return currentVoteRound;
  }

  async moveToNextVoter(gameId: string, voteRoundId: string, playerId: string) {
    const gameCache = this.gameCache.get(gameId);
    //get all players
    const players =
      gameCache?.players ??
      (await this.playerService.listExecutivePlayers({
        where: {
          gameId: gameId,
        },
      }));
    if (!players) {
      throw new Error('Players not found');
    }
    const player = players.find((player) => player.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }
    //get game
    const gameTurn =
      gameCache?.currentGameTurn ??
      (await this.gameTurnService.getLatestTurn(player.gameId));
    if (!gameTurn) {
      throw new Error('Game turn not found');
    }
    const newPlayer = this.findNewActivePlayer(player, players);
    if (newPlayer.isCOO) {
      //we've gone around the table, now resolve the vote
      await this.startPhase({
        gameId: player.gameId,
        gameTurnId: gameTurn.id,
        phaseName: ExecutivePhaseName.RESOLVE_VOTE,
      });
    } else {
      //update the phase
      await this.startPhase({
        gameId: player.gameId,
        gameTurnId: gameTurn.id,
        phaseName: ExecutivePhaseName.VOTE,
        activePlayerId: newPlayer.id,
      });
    }
  }
}
