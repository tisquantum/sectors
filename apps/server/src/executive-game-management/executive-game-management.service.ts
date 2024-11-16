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
        console.log('SELECT_TRICK', activePlayerId);
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
    //influenceBids
    let influenceBids =
      await this.influenceBidService.listExecutiveInfluenceBids({
        where: {
          executiveGameTurnId: gameTurnId,
        },
      });
    if (influenceBids) {
      const currentCache = this.gameCache.get(gameTurnId);
      this.gameCache.set(gameTurnId, { ...currentCache, influenceBids });
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
    console.log('influenceCounts', influenceCounts);

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
    console.log('voteMarkers', voteMarkers);
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
    //get all cards that are in trick or trump
    const cardsInPlay = await this.cardService.listExecutiveCards({
      where: {
        gameId,
        cardLocation: {
          in: [
            CardLocation.TRICK,
            CardLocation.TRUMP,
            CardLocation.BRIBE,
            CardLocation.HAND,
          ],
        },
      },
    });
    console.log('boardCleanup cardsInPlay', cardsInPlay);
    //move all cards back to deck and update player to null
    await Promise.all(
      cardsInPlay.map((card) =>
        this.cardService.updateExecutiveCard({
          where: { id: card.id },
          data: {
            cardLocation: CardLocation.DECK,
            player: { disconnect: true }, //TODO: have we forgot to do this in other places?
          },
        }),
      ),
    );
  }

  async newTrickOrTurn(gameId: string, gameTurn: ExecutiveGameTurn) {
    //get tricks for game turn
    const executiveTricks = await this.prisma.executiveTrick.findMany({
      where: {
        turnId: gameTurn.id,
      },
    });
    console.log('newTrickOrTurn tricks', executiveTricks);
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
    //get the latest trick being played this turn
    const trick = await this.prisma.executiveTrick.findFirst({
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
    });
    console.log('determineTrickBidder trick', trick, players.length);
    if (!trick) {
      throw new Error('Trick not found');
    }
    //if the trick has cards played equal to the number of players, start the next phase
    if (trick.trickCards.length === players.length) {
      console.log('determineTrickBidder trick complete, starting next phase');
      return await this.startPhase({
        gameId: gameTurn.gameId,
        gameTurnId: gameTurn.id,
        phaseName: ExecutivePhaseName.RESOLVE_TRICK,
      });
    }
    //get the current phase
    const currentPhase = await this.phaseService.getCurrentPhase(
      gameTurn.gameId,
    );
    if (!currentPhase) {
      throw new Error('Current phase not found');
    }
    //get the previous phase
    const previousSelectTrickOfExecutiveTrickPhase = trick.phases
      .filter((phase) => phase.phaseName === ExecutivePhaseName.SELECT_TRICK)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
    console.log(
      'determineTrickBidder previousSelectTrickOfExecutiveTrickPhase',
      previousSelectTrickOfExecutiveTrickPhase,
    );
    let nextPlayer: ExecutivePlayer | null = null;
    if (!previousSelectTrickOfExecutiveTrickPhase) {
      //get the COO player
      nextPlayer = await this.playerService.findExecutivePlayer({
        gameId: gameTurn.gameId,
        isCOO: true,
      });
      if (!nextPlayer) {
        console.error('COO not found');
        throw new Error('COO not found');
      }
    } else {
      if (!previousSelectTrickOfExecutiveTrickPhase.activePlayerId) {
        console.error('Active player not found');
        throw new Error('Active player not found');
      }
      //get the player
      const previousPlayer = await this.playerService.getExecutivePlayer({
        id: previousSelectTrickOfExecutiveTrickPhase.activePlayerId,
      });
      if (!previousPlayer) {
        console.error('Previous player not found');
        throw new Error('Previous player not found');
      }
      //get the next player
      nextPlayer = this.findNewActivePlayer(previousPlayer, players);
      console.log('determineTrickBidder nextPlayer', nextPlayer);
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
    this.startPhase({
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

  async determineInfluenceBidSelector(
    gameTurnId: string,
    gameId: string,
    currentPhaseId: string,
  ) {
    console.log('determineInfluenceSelector', gameTurnId);
    let players;
    try {
      players = await this.playerService.listExecutivePlayersNoRelations({
        where: {
          gameId: gameId,
        },
      });
      console.log('got players');
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
      console.log('previousPhase', previousPhase);
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
        console.log('nextPlayer', nextPlayer?.id);
      } catch (error) {
        console.error('error', error);
        throw new Error('COO not found');
      }
      if (!nextPlayer) {
        throw new Error('COO not found');
      }
      try {
        //update the phase
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
      if (!previousPhase.activePlayerId) {
        throw new Error('Active player not found');
      }
      //get the player
      let previousPlayer;
      try {
        previousPlayer = await this.playerService.getExecutivePlayer({
          id: previousPhase?.activePlayerId,
        });
        console.log('previousPlayer', previousPlayer?.id);
      } catch (error) {
        console.error('error', error);
        throw new Error('Previous player not found');
      }
      if (!previousPlayer) {
        throw new Error('Previous player not found');
      }
      try {
        console.log('looking for next player');
        //get the next player
        nextPlayer = this.findNewActivePlayer(previousPlayer, players);
        console.log('nextPlayer', nextPlayer?.id);
      } catch (error) {
        console.error('error', error);
        throw new Error('Next player not found');
      }
      if (nextPlayer.isCOO) {
        try {
          console.log('nextPlayer is COO');
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
    console.log('previousPhase', previousPhase);
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
    console.log('nextPhase newPhaseName', gameId, gameTurnId, newPhaseName);
    await this.startPhase({ gameId, gameTurnId, phaseName: newPhaseName });
  }

  async submitInfluenceBid(
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
    const gameTurn =
      currentCache?.currentGameTurn ??
      (await this.gameTurnService.getLatestTurn(gameId));
    if (!gameTurn) {
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
        ExecutiveGameTurn: { connect: { id: gameTurn.id } },
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
    const gameCache = this.gameCache.get(gameId);
    const [trick, card, player] = await Promise.all([
      await this.prisma.executiveTrick.findFirst({
        where: {
          turnId: gameTurnId,
        },
        include: {
          trickCards: {
            include: {
              card: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      await this.cardService.getExecutiveCard({ id: cardId }),
      await this.playerService.getExecutivePlayerWithCards({
        id: playerId,
      }),
    ]);

    if (!trick) {
      throw new Error('Trick not found');
    }
    //get the cards in the current trick
    const trickCards = trick.trickCards;
    //ensure player has not already played a card in the current trick
    const playerHasPlayedCard = trickCards.some(
      (trickCard) => trickCard.card.playerId === playerId,
    );
    if (playerHasPlayedCard) {
      throw new Error('Player has already played a card in the current trick');
    }
    //get the lead card
    const leadCard = trickCards.find((trickCard) => trickCard.isLead);
    const trumpCard = trickCards.find((trickCard) => trickCard.isTrump);
    if (!card) {
      throw new Error('Card not found');
    }
    if (!player) {
      throw new Error('Player not found');
    }
    //does player in fact own the card
    if (card.playerId !== playerId) {
      throw new Error('Player does not own the card');
    }
    const cardMap = player.cards.reduce(
      (acc, playerCard) => {
        if (!acc[playerCard.cardLocation]) {
          acc[playerCard.cardLocation] = [];
        }
        acc[playerCard.cardLocation].push(playerCard);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    const playerHand = cardMap[CardLocation.HAND] || [];
    const playerGifts = cardMap[CardLocation.GIFT] || [];
    const playerGiftsNotLocked = playerGifts.filter((gift) => !gift.isLocked);
    //check if card is from hand or from gifts
    if (
      card.cardLocation !== CardLocation.HAND &&
      card.cardLocation !== CardLocation.GIFT
    ) {
      throw new Error('Card not in hand or gift');
    }
    //if card is from hand, look at hand and ensure the player has not played a card that doesn't follow the lead
    if (card.cardLocation === CardLocation.HAND) {
      //does card follow the lead
      if (card.cardSuit !== leadCard?.card.cardSuit) {
        //get all cards in hand that are not the selected card
        const playerHandNotSelectedCard = playerHand.filter(
          (handCard) => handCard.id !== cardId,
        );
        //if there is a lead card, check if the player is following the lead
        if (leadCard) {
          //does playerHandNotSelectedCard contain a card that follows the lead
          const doesSelectionViolateFollowSuitRule =
            playerHandNotSelectedCard.some(
              (handCard) => handCard.cardSuit === leadCard.card.cardSuit,
            );
          if (doesSelectionViolateFollowSuitRule) {
            throw new Error('Player must follow the lead');
          }
        }
      }
    }
    if (card.cardLocation === CardLocation.GIFT) {
      //ensure card is not locked
      if (card.isLocked) {
        throw new Error('Card is locked');
      }
      //look at all cards amongst hand and gifts not locked
      const allViablePlayableCards = playerHand.concat(playerGiftsNotLocked);
      //filter out the card selected from the viable playable cards
      const viablePlayableCards = allViablePlayableCards.filter(
        (viablePlayableCard) => viablePlayableCard.id !== cardId,
      );
      //if there is a lead card, check if the player is following the lead
      if (leadCard) {
        //does the playing card follow the lead?
        if (card.cardSuit !== leadCard.card.cardSuit) {
          //does playerHandNotSelectedCard contain a card that follows the lead
          const doesSelectionViolateFollowSuitRule = viablePlayableCards.some(
            (handCard) => handCard.cardSuit === leadCard.card.cardSuit,
          );
          if (doesSelectionViolateFollowSuitRule) {
            console.error(
              'Player must follow the lead - played from gift.',
              viablePlayableCards,
            );
            throw new Error('Player must follow the lead - played from gift.');
          }
        }
      }
    }
    try {
      //update the card
      await this.cardService.updateExecutiveCard({
        where: { id: cardId },
        data: {
          cardLocation: CardLocation.TRICK,
        },
      });
    } catch (error) {
      console.error('error', error);
      throw new Error('Card not found');
    }
    try {
      //create the trickCard
      await this.prisma.trickCard.create({
        data: {
          trick: { connect: { id: trick.id } },
          card: { connect: { id: cardId } },
          player: { connect: { id: playerId } },
          isLead: !!!leadCard,
          gameTurnId,
        },
      });
    } catch (error) {
      console.error('error', error);
      throw new Error('Trick card not found');
    }
    //get players
    const players =
      gameCache?.players ??
      (await this.playerService.listExecutivePlayersNoRelations({
        where: {
          gameId: player.gameId,
        },
      }));
    if (!players) {
      throw new Error('Players not found');
    }
    //get the next player
    const nextPlayer = await this.findNewActivePlayer(player, players);
    if (!nextPlayer) {
      throw new Error('Next player not found');
    }
    //if next player is the COO, we've gone around the table, resolve the trick
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
    const [executiveTrick, ceoInfluence] = await Promise.all([
      await this.prisma.executiveTrick.findFirst({
        where: {
          turnId: gameTurnId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          trickCards: {
            include: {
              card: true,
            },
          },
        },
      }),
      await this.influenceService.listInfluences({
        where: {
          gameId: gameId,
          influenceType: InfluenceType.CEO,
          influenceLocation: InfluenceLocation.CEO,
        },
        take: 1,
      }),
    ]);
    if (!executiveTrick) {
      throw new Error('Trick not found');
    }
    //TODO: This isn't being used this way right now, we just detect trump through card location
    const trickCardsNoTrump = executiveTrick.trickCards.filter(
      (trickCard) => !trickCard.isTrump,
    );

    //get the lead card suit
    const leadCard = executiveTrick.trickCards.find(
      (trickCard) => trickCard.isLead,
    );
    //get local cache
    const cache = this.gameCache.get(gameId);

    //get the trump card suit
    const trumpCard =
      cache?.currentTrumpCard ??
      (await this.cardService.findExecutiveCard({
        gameId: executiveTrick.gameId,
        cardLocation: CardLocation.TRUMP,
      }));
    console.log('executiveTrick', executiveTrick);
    console.log('leadCard', leadCard);
    console.log('trumpCard', trumpCard);
    if (!leadCard) {
      throw new Error('Lead card suit not found');
    }
    if (!trumpCard) {
      throw new Error('Trump card suit not found');
    }
    //iterate over trickCardsNoTrump and get the highest ranked card of the trump if trump is followed or the highest ranked card of the lead suit if trump is not followed
    const trickLeader = this.getTrickLeader(
      trickCardsNoTrump.map((trickCard) => trickCard.card),
      leadCard.card.cardSuit,
      trumpCard.cardSuit,
    );

    if (!trickLeader.playerId) {
      //TODO: This is more of an assertion than an error
      throw new Error('Trick leader not found');
    }
    if (!ceoInfluence) {
      throw new Error('CEO influence not found');
    }
    try {
      //update the influence
      await this.influenceService.updateInfluence({
        where: { id: ceoInfluence[0].id },
        data: {
          ownedByPlayer: { connect: { id: trickLeader.playerId } },
          influenceLocation: InfluenceLocation.OWNED_BY_PLAYER,
        },
      });
    } catch (error) {
      console.error('error', error);
      throw new Error('Influence not found');
    }
    try {
      //update the trick winner
      await this.prisma.executiveTrick.update({
        where: {
          id: executiveTrick.id,
        },
        data: {
          trickWinnerId: trickLeader.playerId,
        },
      });
    } catch (error) {
      console.error('error', error);
      throw new Error('Trick winner not found');
    }
    //remove ceo from the previous trick winner
    await this.playerService.updateManyExecutivePlayers({
      where: { gameId: executiveTrick.gameId },
      data: {
        isCOO: false,
      },
    });

    //make the trick winner the new coo
    await this.playerService.updateExecutivePlayer({
      where: { id: trickLeader.playerId },
      data: {
        isCOO: true,
      },
    });
    const gameCache = this.gameCache.get(gameId);
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
    this.gameCache.set(gameId, {
      ...gameCache, // Should use gameCache instead of cache
      players: players.map((player) => {
        if (player.id === trickLeader.playerId) {
          return {
            ...player,
            isCOO: true,
          };
        } else {
          return {
            ...player,
            isCOO: false,
          };
        }
      }),
    });
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
    // Draw enough cards for both hands and bribes for each player
    const totalCardsNeeded =
      players.length * handSize + players.length * BRIBE_CARD_HAND_SIZE;
    const cards = await this.cardService.drawCards(gameId, totalCardsNeeded);

    // Divide cards into hands and bribes
    const handCards = cards.slice(0, players.length * handSize);
    const bribeCards = cards.slice(players.length * handSize);
    console.log('handCards', handCards);
    console.log('bribeCards', bribeCards);
    // Assign hand and bribe cards to each player
    for (let i = 0; i < players.length; i++) {
      const playerId = players[i].id;

      // Get hand and bribe cards for the current player
      const playerHandCards = handCards.slice(i * handSize, (i + 1) * handSize);
      const playerBribeCards = bribeCards.slice(
        i * BRIBE_CARD_HAND_SIZE,
        (i + 1) * BRIBE_CARD_HAND_SIZE,
      );
      console.log('playerHandCards', playerHandCards);
      console.log('playerBribeCards', playerBribeCards);
      // Update hand cards
      await this.cardService.updateManyExecutiveCards({
        where: {
          id: { in: playerHandCards.map((card) => card.id) },
        },
        data: {
          cardLocation: CardLocation.HAND,
          playerId,
        },
      });

      // Update bribe cards
      await this.cardService.updateManyExecutiveCards({
        where: {
          id: { in: playerBribeCards.map((card) => card.id) },
        },
        data: {
          cardLocation: CardLocation.BRIBE,
          playerId,
        },
      });
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

  async createExecutiveInfluenceBidFromClient({
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
      (await this.gameTurnService.getLatestTurn(fromPlayer.gameId))?.id;
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

  async pingPlayers(gameId: string) {
    await this.pusher.trigger(getGameChannelId(gameId), EVENT_PING_PLAYERS, {});
  }

  async playerPass(gameId: string, playerId: string) {
    const currentCache = this.gameCache.get(gameId);
    console.log('playerPass playerId', playerId);
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
    const gameTurn =
      currentCache?.currentGameTurn ??
      (await this.gameTurnService.getLatestTurn(gameId));
    if (!gameTurn) {
      throw new Error('Game turn not found');
    }
    const currentPhase =
      currentCache?.currentPhase ??
      (await this.phaseService.getCurrentPhase(gameId));
    //ensure player has not already passed
    const existingPass = await this.prisma.executivePlayerPass.findFirst({
      where: {
        playerId,
        gameTurnId: gameTurn.id,
      },
    });
    if (existingPass) {
      throw new Error('Player has already passed');
    }
    //create player pass
    const pass = await this.prisma.executivePlayerPass.create({
      data: {
        player: { connect: { id: playerId } },
        gameTurn: { connect: { id: gameTurn.id } },
      },
    });
    console.log('pass', pass);
    const playerPasses = await this.prisma.executivePlayerPass.findMany({
      where: {
        gameTurnId: gameTurn.id,
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
        gameId: gameTurn.gameId,
        gameTurnId: gameTurn.id,
        phaseName: nextPhase,
      });
    } else {
      await this.startPhase({
        gameId: gameTurn.gameId,
        gameTurnId: gameTurn.id,
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
    const player = await this.playerService.getExecutivePlayer({
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
