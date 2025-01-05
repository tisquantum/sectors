// ai-bot.service.ts
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { GamesService } from '@server/games/games.service';
import { PlayersService } from '@server/players/players.service';
import { PhaseService } from '@server/phase/phase.service';
import { PlayerOrderService } from '@server/player-order/player-order.service';
import { OptionContractService } from '@server/option-contract/option-contract.service';
// ...other imports as needed

// Import from your schema if you have them
import {
  PhaseName,
  RoundType,
  Player,
  OrderType,
  OrderStatus,
  ShareLocation,
  CompanyStatus,
  OperatingRoundAction,
  RevenueDistribution,
  CompanyTier,
} from '@prisma/client';
import { DEFAULT_INFLUENCE, MAX_SHARE_PERCENTAGE } from '@server/data/constants';
import { GameManagementService } from '@server/game-management/game-management.service';
import { RevenueDistributionVoteService } from '@server/revenue-distribution-vote/revenue-distribution-vote.service';
import { OperatingRoundService } from '@server/operating-round/operating-round.service';
import { OperatingRoundVoteService } from '@server/operating-round-vote/operating-round-vote.service';
import { CompanyWithRelations, PlayerWithShares } from '@server/prisma/prisma.types';

/**
 * AiBotService
 * -----------
 * Handles all AI/bot logic for each of the major phases.
 *
 * Each method is a skeleton demonstrating where you'd put
 * actual logic for your AI. The placeholders show minimal,
 * random, or "do nothing" steps.
 *
 * You can expand them to meet your requirements:
 *  e.g. choosing best IPO prices, bidding certain influence,
 *  deciding how to vote for production, picking short/option actions, etc.
 */
@Injectable()
export class AiBotService {
  constructor(private readonly playersService: PlayersService) {}
  // ----------------------------------------------------------------------------
  // HELPER METHODS
  // ----------------------------------------------------------------------------

  /**
   * Helper to retrieve only bot players for this game.
   */
  public async getBotPlayers(gameId: string): Promise<Player[]> {
    return this.playersService.players({
      where: { gameId, isBot: true },
    });
  }

  public async getBotPlayersWithShares(
    gameId: string,
  ): Promise<PlayerWithShares[]> {
    return this.playersService.playersWithShares({ gameId, isBot: true });
  }

  /**
   * Helper to pick a random int in a range [min, max].
   */
  public randomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  //BOT MARKET HELPERS
    // --------------------------------------------------------------------------
  // Helper to see how many stock actions a player can still place this turn
  // e.g. if you have a "marketOrderActions" left, or a DB entry for how many
  // orders remain.
  private async getPlayerOrderActionsLeft(playerId: string): Promise<number> {
    // For demonstration, let's say each bot has 3 available.
    // In a real code, you'd fetch from DB or 
    //  something like: player.marketOrderActions.
    return 3;
  }

  // --------------------------------------------------------------------------
  // Check if this bot is at 60% ownership in all companies
  public isAt60PercentForAllCompanies(
    bot: PlayerWithShares,
    companies: CompanyWithRelations[],
  ): boolean {
    return companies.every((c) => {
      const totalShares = c.Share.length;
      const botOwned = bot.Share.filter(
        s => s.companyId === c.id && s.location === ShareLocation.PLAYER,
      ).length;
      const percent = (botOwned / totalShares) * 100;
      return percent >= MAX_SHARE_PERCENTAGE;
    });
  }

  // --------------------------------------------------------------------------
  // Build a "Buy" action as a Promise. Returns null if skip is needed.
  public buildBuyAction(
    bot: PlayerWithShares,
    companies: CompanyWithRelations[],
    shareAvail: Map<string, { ipoCount: number; omCount: number }>,
    soldThisTurn: Set<string>,
    gameId: string,
    placeBuyOrder: (bot: PlayerWithShares, company: CompanyWithRelations, quantity: number, location: ShareLocation, gameId: string) => Promise<void>,
  ): Promise<void> | null {
    const chosenCompany = this.pickCompanyToBuy(bot, companies, shareAvail, soldThisTurn);
    if (!chosenCompany) return null;

    const maxShares = this.computeMaxBuyableShares(bot, chosenCompany, shareAvail);
    if (maxShares <= 0) return null;

    const quantity = this.randomInRange(1, maxShares);
    const info = shareAvail.get(chosenCompany.id)!;
    const location = info.ipoCount > 0 ? ShareLocation.IPO : ShareLocation.OPEN_MARKET;

    // Build and return the actual action promise
    return (async () => {
      try {
        await placeBuyOrder(bot, chosenCompany, quantity, location, gameId);
        // Decrement local share counts
        if (location === ShareLocation.IPO) {
          info.ipoCount = Math.max(0, info.ipoCount - quantity);
        } else {
          info.omCount  = Math.max(0, info.omCount - quantity);
        }
      } catch (err) {
        console.error(`Bot [${bot.nickname}] parallel buy failed:`, err);
      }
    })();
  }

  // --------------------------------------------------------------------------
  // Build a "Sell" action as a Promise. Returns null if skip is needed.
  public buildSellAction(
    bot: PlayerWithShares,
    companies: CompanyWithRelations[],
    soldThisTurn: Set<string>,
    gameId: string,
    placeSellOrder: (bot: PlayerWithShares, company: CompanyWithRelations, quantity: number, gameId: string) => Promise<void>,
  ): Promise<void> | null {
    const sellCandidate = this.pickCompanyToSell(bot, companies);
    if (!sellCandidate) return null;

    const shareCount = bot.Share.filter(
      s => s.companyId === sellCandidate.id && s.location === ShareLocation.PLAYER
    ).length;
    if (shareCount === 0) return null;

    const quantity = this.randomInRange(1, shareCount);

    return (async () => {
      try {
        await placeSellOrder(bot, sellCandidate, quantity, gameId);
        // Mark that we sold this company => skip buying it again
        soldThisTurn.add(sellCandidate.id);
      } catch (err) {
        console.error(`Bot [${bot.nickname}] parallel sell failed:`, err);
      }
    })();
  }

  // --------------------------------------------------------------------------
  // Decide which company to buy using heuristics + skip those at 60%, etc.
  // Reuses a "scoreCompany()" approach to pick the best companies, etc.
  public pickCompanyToBuy(
    bot: PlayerWithShares,
    companies: CompanyWithRelations[],
    shareAvail: Map<string, { ipoCount: number; omCount: number }>,
    soldThisTurn: Set<string>
  ): CompanyWithRelations | null {
    const valid = companies.filter((c) => {
      if (soldThisTurn.has(c.id)) return false;
      const avail = shareAvail.get(c.id);
      if (!avail) return false;
      if ((avail.ipoCount + avail.omCount) <= 0) return false;

      const totalShares = c.Share.length;
      const botShares   = bot.Share.filter(
        s => s.companyId === c.id && s.location === ShareLocation.PLAYER,
      ).length;
      const percent = (botShares / totalShares) * 100;
      if (percent >= MAX_SHARE_PERCENTAGE) return false;

      return true;
    });

    if (!valid.length) return null;

    // Score and sort
    const scored = valid.map(c => ({
      company: c,
      score: this.scoreCompany(c, bot),
    }));
    scored.sort((a, b) => b.score - a.score);

    // pick from top 3
    const topN = 3;
    const bestFew = scored.slice(0, topN);

    // if best is negative => skip
    if (bestFew[0]?.score < 0) {
      return null;
    }

    const idx = this.randomInRange(0, bestFew.length - 1);
    return bestFew[idx].company;
  }

  // --------------------------------------------------------------------------
  // Simple scoring function: 
  // +5 if currentStockPrice < ipoAndFloatPrice (undervalued)
  // -2 if currentStockPrice > 2x ipoAndFloatPrice
  // Tiers: BLUE_CHIP => +10, GROWTH => +5, STARTUP => +2
  public scoreCompany(
    company: CompanyWithRelations,
    bot: PlayerWithShares,
  ): number {
    let score = 0;
    const price = company.currentStockPrice || 0;
    const ipo   = company.ipoAndFloatPrice || 0;

    if (price < ipo) score += 5;
    else if (price > ipo * 2) score -= 2;

    switch (company.companyTier as CompanyTier) {
      case CompanyTier.INCUBATOR:
        score += 1;
        break;
      case CompanyTier.STARTUP:
        score += 2;
        break;
      case CompanyTier.GROWTH:
        score += 3;
        break;
      case CompanyTier.ESTABLISHED:
        score += 4;
        break;
      case CompanyTier.ENTERPRISE:
        score += 5;
        break;
      case CompanyTier.CONGLOMERATE:
        score += 6;
        break;
      case CompanyTier.TITAN:
        score += 7;
        break;
      default:
        break;
    }

    return score;
  }

  // --------------------------------------------------------------------------
  // Return how many shares the bot can buy, factoring in 
  // 60% limit, physical share availability, and approximate cash constraints.
  private computeMaxBuyableShares(
    bot: PlayerWithShares,
    company: CompanyWithRelations,
    shareAvail: Map<string, { ipoCount: number; omCount: number }>
  ): number {
    const total = company.Share.length;
    const botOwned = bot.Share.filter(
      s => s.companyId === company.id && s.location === ShareLocation.PLAYER
    ).length;
    const maxBotCanOwn = Math.floor(total * (MAX_SHARE_PERCENTAGE / 100));
    const currentlyCanOwn = maxBotCanOwn - botOwned;
    if (currentlyCanOwn <= 0) return 0;

    const info = shareAvail.get(company.id)!;
    const physical = info.ipoCount + info.omCount;
    const limitByPhysical = Math.min(currentlyCanOwn, physical);

    // approximate cash-based
    const stockPrice = company.currentStockPrice || company.ipoAndFloatPrice || 0;
    if (stockPrice <= 0) {
      // if we have no price => treat it as free? That might be weird. Let's say unlimited?
      return limitByPhysical;
    }
    const maxByCash = Math.floor(bot.cashOnHand / stockPrice);
    return Math.max(0, Math.min(limitByPhysical, maxByCash));
  }

  

  // --------------------------------------------------------------------------
  // Choose a random company from the bot's portfolio for selling
  private pickCompanyToSell(
    bot: PlayerWithShares,
    companies: CompanyWithRelations[],
  ): CompanyWithRelations | null {
    // find which companies the bot actually holds
    const myCompanies = new Set<string>();
    for (const sh of bot.Share) {
      if (sh.location === ShareLocation.PLAYER) {
        myCompanies.add(sh.companyId);
      }
    }
    const possible = companies.filter(c => myCompanies.has(c.id));
    if (!possible.length) return null;

    const index = this.randomInRange(0, possible.length - 1);
    return possible[index];
  }
}
