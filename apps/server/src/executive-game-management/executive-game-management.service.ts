import { Injectable } from '@nestjs/common';
import {
  CardLocation,
  CardSuit,
  ExecutiveCard,
  ExecutivePlayer,
  InfluenceLocation,
} from '@prisma/client';
import { ExecutiveCardService } from '@server/executive-card/executive-card.service';
import { ExecutiveGameService } from '@server/executive-game/executive-game.service';
import { ExecutiveInfluenceBidService } from '@server/executive-influence-bid/executive-influence-bid.service';
import { ExecutiveInfluenceService } from '@server/executive-influence/executive-influence.service';
import { ExecutivePlayerService } from '@server/executive-player/executive-player.service';
import { PrismaService } from '@server/prisma/prisma.service';

export const ROUND_1_CARD_HAND_SIZE = 1;
export const ROUND_2_CARD_HAND_SIZE = 2;
export const ROUND_3_CARD_HAND_SIZE = 3;
export const ROUND_4_CARD_HAND_SIZE = 4;
export const BRIBE_CARD_HAND_SIZE = 1;

@Injectable()
export class ExecutiveGameManagementService {
  constructor(
    private prisma: PrismaService,
    private gameService: ExecutiveGameService,
    private playerService: ExecutivePlayerService,
    private cardService: ExecutiveCardService,
    private influenceService: ExecutiveInfluenceService,
    private influenceBidService: ExecutiveInfluenceBidService,
  ) {}

  async startGame(roomId: number, gameName: string) {
    //create the game
    const game = await this.gameService.createExecutiveGame({ name: gameName });
    //add players to the game
    const players = await this.addPlayersToGame(game.id, roomId);
    //create the cards and add them to the deck
    await this.cardService.createDeck(game.id);
    // Draw enough cards for both hands and bribes for each player
    const totalCardsNeeded =
      players.length * ROUND_1_CARD_HAND_SIZE +
      players.length * BRIBE_CARD_HAND_SIZE;
    const cards = await this.cardService.drawCards(game.id, totalCardsNeeded);

    // Divide cards into hands and bribes
    const handCards = cards.slice(0, players.length * ROUND_1_CARD_HAND_SIZE);
    const bribeCards = cards.slice(players.length * ROUND_1_CARD_HAND_SIZE);

    // Assign hand and bribe cards to each player
    for (let i = 0; i < players.length; i++) {
      const playerId = players[i].id;

      // Get hand and bribe cards for the current player
      const playerHandCards = handCards.slice(
        i * ROUND_1_CARD_HAND_SIZE,
        (i + 1) * ROUND_1_CARD_HAND_SIZE,
      );
      const playerBribeCards = bribeCards.slice(
        i * BRIBE_CARD_HAND_SIZE,
        (i + 1) * BRIBE_CARD_HAND_SIZE,
      );

      // Update hand cards
      await this.cardService.updateExecutiveCards(
        playerHandCards.map((card) => ({
          ...card,
          cardLocation: CardLocation.HAND,
          playerId,
        })),
      );

      // Update bribe cards
      await this.cardService.updateExecutiveCards(
        playerBribeCards.map((card) => ({
          ...card,
          cardLocation: CardLocation.BRIBE,
          playerId,
        })),
      );
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

  async dealCards(gameId: string) {
    const deck = await this.cardService.getDeck(gameId);
    const players = await this.playerService.listExecutivePlayers({
      where: {
        gameId,
      },
    });

    const shuffledDeck = await this.cardService.shuffleDeck(gameId);
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
      users.map((user) => ({
        userId: user.userId,
        gameId,
      })),
    );
  }
}
