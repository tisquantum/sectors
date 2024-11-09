import { Injectable } from '@nestjs/common';
import {
  CardLocation,
  CardSuit,
  ExecutiveCard,
  ExecutiveGameTurn,
  ExecutivePhase,
  ExecutivePhaseName,
  ExecutivePlayer,
  InfluenceLocation,
  InfluenceType,
  TurnType,
} from '@prisma/client';
import {
  BRIBE_CARD_HAND_SIZE,
  INFLUENCE_CEO_STARTING,
  INFLUENCE_PLAYER_STARTING,
  ROUND_1_CARD_HAND_SIZE,
  ROUND_2_CARD_HAND_SIZE,
  ROUND_3_CARD_HAND_SIZE,
  ROUND_4_CARD_HAND_SIZE,
} from '@server/data/executive_constants';
import { ExecutiveCardService } from '@server/executive-card/executive-card.service';
import { ExecutiveGameTurnService } from '@server/executive-game-turn/executive-game-turn.service';
import { ExecutiveGameService } from '@server/executive-game/executive-game.service';
import { ExecutiveInfluenceBidService } from '@server/executive-influence-bid/executive-influence-bid.service';
import { ExecutiveInfluenceService } from '@server/executive-influence/executive-influence.service';
import { ExecutivePhaseService } from '@server/executive-phase/executive-phase.service';
import { ExecutivePlayerService } from '@server/executive-player/executive-player.service';
import { PrismaService } from '@server/prisma/prisma.service';
import {
  EVENT_EXECUTIVE_GAME_STARTED,
  EVENT_PING_PLAYERS,
  getExecutiveGameChannelId,
  getGameChannelId,
  getRoomChannelId,
} from '@server/pusher/pusher.types';
import { timeStamp } from 'console';
import { PusherService } from 'nestjs-pusher';

@Injectable()
export class ExecutiveGameManagementService {
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
  ) {}

  async startGame(roomId: number, gameName: string) {
    //create the game
    const game = await this.gameService.createExecutiveGame({
      name: gameName,
      Room: { connect: { id: roomId } },
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

    this.startPhase(game.id, turn.id, ExecutivePhaseName.START_GAME);

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

  async resolvePhase(
    gameTurn: ExecutiveGameTurn,
    phaseName: ExecutivePhaseName,
  ) {
    switch (phaseName) {
      case ExecutivePhaseName.START_GAME:
        await this.nextPhase(gameTurn.gameId, gameTurn.id, phaseName);
        return;
      case ExecutivePhaseName.DEAL_CARDS:
        await this.dealCards(
          gameTurn.gameId,
          this.getCardHandSizeForTurn(gameTurn.turnNumber),
        );
        await this.nextPhase(gameTurn.gameId, gameTurn.id, phaseName);
        break;
      case ExecutivePhaseName.MOVE_COO_AND_GENERAL_COUNSEL:
        await this.resolveMoveCOOAndGeneralCounsel(gameTurn.gameId);
        await this.nextPhase(gameTurn.gameId, gameTurn.id, phaseName);
        break;
      case ExecutivePhaseName.INFLUENCE_BID:
        await this.determineInfluenceBidder(gameTurn.gameId);
        await this.pingPlayers(gameTurn.gameId);
        break;
      default:
        return;
    }
  }

  async determineInfluenceBidder(gameId: string) {
    //find all players
    const players = await this.playerService.listExecutivePlayers({
      where: {
        gameId,
      },
    });
    //find the general counsel
    const generalCounsel = players.find((player) => player.isGeneralCounsel);
    if (!generalCounsel) {
      throw new Error('General Counsel not found');
    }
    //assign this player as the activePlayer in the currentPhase
    //get current phase
    const currentPhase = await this.phaseService.getCurrentPhase(gameId);
    if (!currentPhase) {
      throw new Error('Current phase not found');
    }
    //get the previous phase
    const previousPhase = await this.phaseService.getPreviousPhase(gameId);
    console.log('previousPhase', previousPhase);
    //get player id of previous phase
    const previousPlayerId = previousPhase?.activePlayerId;
    if (!previousPlayerId) {
      //update the phase
      await this.phaseService.updateExecutivePhase({
        where: { id: currentPhase.id },
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
      const newActivePlayerSeatIndex =
        previousPlayer.seatIndex + 1 >= players.length
          ? 0
          : previousPlayer.seatIndex + 1;
      const newActivePlayer = players.find(
        (player) => player.seatIndex == newActivePlayerSeatIndex,
      );
      if (!newActivePlayer) {
        throw new Error('New active player not found');
      }
      //update the phase
      await this.phaseService.updateExecutivePhase({
        where: { id: currentPhase.id },
        data: {
          player: { connect: { id: newActivePlayer.id } },
        },
      });
    }
  }

  async resolveMoveCOOAndGeneralCounsel(gameId: string) {
    //get game players
    const players = await this.playerService.listExecutivePlayers({
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
    await this.playerService.updateExecutivePlayer({
      where: { id: players[generalCounselSeatIndex].id },
      data: {
        isGeneralCounsel: true,
      },
    });
  }

  async startPhase(
    gameId: string,
    gameTurnId: string,
    phaseName: ExecutivePhaseName,
  ) {
    //create the phase
    const phase = await this.phaseService.createExecutivePhase({
      game: { connect: { id: gameId } },
      gameTurn: { connect: { id: gameTurnId } },
      phaseName,
    });
    const gameTurn = await this.gameTurnService.getLatestTurn(gameId);
    if (!gameTurn) {
      throw new Error('Game turn not found');
    }
    await this.resolvePhase(gameTurn, phase.phaseName);
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
    console.log('nextPhase newPhaseName', newPhaseName);
    await this.startPhase(gameId, gameTurnId, newPhaseName);
  }

  determineNextExecutivePhaseTrick(phaseName: ExecutivePhaseName) {
    switch (phaseName) {
      case ExecutivePhaseName.START_GAME:
        return ExecutivePhaseName.DEAL_CARDS;
      case ExecutivePhaseName.DEAL_CARDS:
        return ExecutivePhaseName.MOVE_COO_AND_GENERAL_COUNSEL;
      case ExecutivePhaseName.MOVE_COO_AND_GENERAL_COUNSEL:
        return ExecutivePhaseName.INFLUENCE_BID;
      //loop
      case ExecutivePhaseName.INFLUENCE_BID:
        return ExecutivePhaseName.INFLUENCE_BID;
      case ExecutivePhaseName.INFLUENCE_BID_SELECTION:
        return ExecutivePhaseName.INFLUENCE_BID_SELECTION;
      //loop
      case ExecutivePhaseName.SELECT_TRICK:
        return ExecutivePhaseName.REVEAL_TRICK;
      case ExecutivePhaseName.REVEAL_TRICK:
        return ExecutivePhaseName.SELECT_TRICK;
      case ExecutivePhaseName.RESOLVE_TRICK:
        return ExecutivePhaseName.DEAL_CARDS;
      default:
        return null;
    }
  }
  async submitInfluenceBid(
    gameId: string,
    playerIdFrom: string,
    playerIdTo: string,
    influenceCount: number,
  ) {
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
    const playerTo = await this.playerService.getExecutivePlayer({
      id: playerIdTo,
    });
    if (!playerTo) {
      throw new Error('Player not found');
    }
    //get influence from count
    const influence = selfInfluenceOwned.slice(0, influenceCount);

    //add influence to player bid
    return this.influenceBidService.createExecutiveInfluenceBid(
      {
        game: { connect: { id: gameId } },
        player: { connect: { id: playerIdFrom } },
      },
      influence,
    );
  }

  async resolveInfluenceBidSelection(
    influenceBidSelection: string,
    targetLocation: InfluenceLocation,
  ) {
    //get influence bid
    const influenceBid =
      await this.influenceBidService.getExecutiveInfluenceBid({
        id: influenceBidSelection,
      });
    if (!influenceBid) {
      throw new Error('Influence bid not found');
    }
    //update influence
    await this.influenceService.moveInfluenceBidToPlayer(
      influenceBid,
      targetLocation,
    );
  }

  async playCardIntoTrick(
    cardId: string,
    playerId: string,
    gameTurnId: string,
    executiveTrickId: string,
  ) {
    //get the current trick
    const trick = await this.prisma.executiveTrick.findUnique({
      where: {
        id: executiveTrickId,
      },
      include: {
        trickCards: {
          include: {
            card: true,
          },
        },
      },
    });
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
    //get the card
    const card = await this.cardService.getExecutiveCard({ id: cardId });
    if (!card) {
      throw new Error('Card not found');
    }
    //get the player
    const player = await this.playerService.getExecutivePlayer({
      id: playerId,
    });
    if (!player) {
      throw new Error('Player not found');
    }

    //does player in fact own the card
    if (card.playerId !== playerId) {
      throw new Error('Player does not own the card');
    }
    //get the player hand
    const playerHand = player.cards.filter((playerCard) => {
      return playerCard.cardLocation === CardLocation.HAND;
    });
    //get the player gift cards
    const playerGifts = player.cards.filter((playerCard) => {
      return playerCard.cardLocation === CardLocation.GIFT;
    });
    //all player gift cards not locked
    const playerGiftsNotLocked = playerGifts.filter(
      (playerGift) => !playerGift.isLocked,
    );
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
        //does playerHandNotSelectedCard contain a card that follows the lead
        const doesSelectionViolateFollowSuitRule = viablePlayableCards.some(
          (handCard) => handCard.cardSuit === leadCard.card.cardSuit,
        );
        if (doesSelectionViolateFollowSuitRule) {
          throw new Error('Player must follow the lead');
        }
      }
    }
    //update the card
    await this.cardService.updateExecutiveCard({
      where: { id: cardId },
      data: {
        cardLocation: CardLocation.TRICK,
      },
    });
  }

  async resolveTrickWinner(executiveTrickId: string) {
    //get the trick
    const executiveTrick = await this.prisma.executiveTrick.findUnique({
      where: {
        id: executiveTrickId,
      },
      include: {
        trickCards: {
          include: {
            card: true,
          },
        },
      },
    });

    if (!executiveTrick) {
      throw new Error('Trick not found');
    }
    const trickCardsNoTrump = executiveTrick.trickCards.filter(
      (trickCard) => !trickCard.isTrump,
    );

    //get the lead card suit
    const leadCardSuit = executiveTrick.trickCards.find(
      (trickCard) => trickCard.isLead,
    )?.card.cardSuit;
    //get the trump card suit
    const trumpCardSuit = executiveTrick.trickCards.find(
      (trickCard) => trickCard.isTrump,
    )?.card.cardSuit;
    if (!leadCardSuit) {
      throw new Error('Lead card suit not found');
    }
    if (!trumpCardSuit) {
      throw new Error('Trump card suit not found');
    }
    //iterate over trickCardsNoTrump and get the highest ranked card of the trump if trump is followed or the highest ranked card of the lead suit if trump is not followed
    const trickLeader = await this.getTrickLeader(
      trickCardsNoTrump.map((trickCard) => trickCard.card),
      leadCardSuit,
      trumpCardSuit,
    );

    if (!trickLeader.playerId) {
      //TODO: This is more of an assertion than an error
      throw new Error('Trick leader not found');
    }
    //update the trick winner
    await this.prisma.executiveTrick.update({
      where: {
        id: executiveTrickId,
      },
      data: {
        trickWinnerId: trickLeader.playerId,
      },
    });
  }

  async getTrickLeader(
    cards: ExecutiveCard[],
    leadCardSuit: CardSuit,
    trumpCardSuit: CardSuit,
  ): Promise<ExecutiveCard> {
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
    const players = await this.playerService.listExecutivePlayers({
      where: {
        gameId,
      },
    });
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
    //get the player
    const fromPlayer = await this.playerService.getExecutivePlayer({
      id: fromPlayerId,
    });
    if (!fromPlayer) {
      throw new Error('From player not found');
    }
    //get the game
    const gameTurn = await this.gameTurnService.getLatestTurn(
      fromPlayer.gameId,
    );
    if (!gameTurn) {
      throw new Error('Game turn not found');
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
    const influenceBid =
      await this.influenceBidService.createExecutiveInfluenceBid(
        {
          game: { connect: { id: fromPlayer.gameId } },
          ExecutiveGameTurn: { connect: { id: gameTurn.id } },
          player: { connect: { id: toPlayerId } },
        },
        ownedSelfInfluence.slice(0, influenceAmount),
      );
    await this.nextPhase(
      fromPlayer.gameId,
      gameTurn.id,
      ExecutivePhaseName.INFLUENCE_BID,
    );
  }

  async pingPlayers(gameId: string) {
    this.pusher.trigger(getGameChannelId(gameId), EVENT_PING_PLAYERS, {});
  }
}
