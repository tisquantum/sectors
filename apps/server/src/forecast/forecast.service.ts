import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameLogService } from '../game-log/game-log.service';
import { SectorService } from '../sector/sector.service';
import { ShareService } from '../share/share.service';
import { SectorName } from '@prisma/client';
import { MAX_SHARE_PERCENTAGE } from '@server/data/constants';

@Injectable()
export class ForecastService {
  constructor(
    private prisma: PrismaService,
    private gameLogService: GameLogService,
    private sectorService: SectorService,
    private shareService: ShareService,
  ) {}

  /**
   * Initialize forecast quarters for a game (4 quarters with costs 4, 3, 2, 1)
   */
  async initializeForecastQuarters(gameId: string) {
    const existingQuarters = await this.prisma.forecastQuarter.findMany({
      where: { gameId },
    });

    if (existingQuarters.length > 0) {
      return existingQuarters; // Already initialized
    }

    const quarters = await Promise.all([
      this.prisma.forecastQuarter.create({
        data: {
          gameId,
          quarterNumber: 1,
          shareCost: 4,
          totalSharesCommitted: 0,
          demandCounters: 0,
          isActive: false,
        },
      }),
      this.prisma.forecastQuarter.create({
        data: {
          gameId,
          quarterNumber: 2,
          shareCost: 3,
          totalSharesCommitted: 0,
          demandCounters: 0,
          isActive: false,
        },
      }),
      this.prisma.forecastQuarter.create({
        data: {
          gameId,
          quarterNumber: 3,
          shareCost: 2,
          totalSharesCommitted: 0,
          demandCounters: 0,
          isActive: false,
        },
      }),
      this.prisma.forecastQuarter.create({
        data: {
          gameId,
          quarterNumber: 4,
          shareCost: 1,
          totalSharesCommitted: 0,
          demandCounters: 0,
          isActive: false,
        },
      }),
    ]);

    return quarters;
  }

  /**
   * Get all forecast quarters for a game
   */
  async getForecastQuarters(gameId: string) {
    return this.prisma.forecastQuarter.findMany({
      where: { gameId },
      orderBy: { quarterNumber: 'asc' },
      include: {
        commitments: {
          include: {
            Player: true,
            Sector: true,
            shares: {
              include: {
                Company: {
                  include: {
                    Sector: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get forecast quarters with sector breakdowns (shares committed and demand counters per sector per quarter)
   */
  async getForecastQuartersWithSectorBreakdown(gameId: string) {
    const quarters = await this.prisma.forecastQuarter.findMany({
      where: { gameId },
      include: {
        commitments: {
          include: {
            Sector: true,
          },
        },
      },
      orderBy: { quarterNumber: 'asc' },
    });

    // Calculate sector breakdowns for each quarter
    return quarters.map((quarter) => {
      // Group commitments by sector
      const sectorBreakdown: Record<string, { sectorId: string; sectorName: string; sharesCommitted: number; demandCounters: number }> = {};
      
      for (const commitment of quarter.commitments) {
        const sectorId = commitment.sectorId;
        if (!sectorBreakdown[sectorId]) {
          sectorBreakdown[sectorId] = {
            sectorId,
            sectorName: commitment.Sector.name,
            sharesCommitted: 0,
            demandCounters: 0,
          };
        }
        sectorBreakdown[sectorId].sharesCommitted += commitment.shareCount;
        // Calculate demand counters for this commitment: shareCount / quarter.shareCost (rounded down)
        const contribution = Math.floor(commitment.shareCount / quarter.shareCost);
        sectorBreakdown[sectorId].demandCounters += contribution;
      }

      return {
        ...quarter,
        sectorBreakdown: Object.values(sectorBreakdown),
      };
    });
  }

  /**
   * Commit shares to a forecast quarter
   */
  async commitSharesToQuarter({
    gameId,
    gameTurnId,
    phaseId,
    playerId,
    quarterId,
    sectorId,
    shareIds,
  }: {
    gameId: string;
    gameTurnId: string;
    phaseId: string;
    playerId: string;
    sectorId: string;
    quarterId: string;
    shareIds: string[];
  }) {
    // Get the phase to check its name
    const phase = await this.prisma.phase.findUnique({
      where: { id: phaseId },
    });

    if (!phase) {
      throw new Error('Phase not found');
    }

    // Check if this is a forecast commitment phase
    const isForecastCommitmentPhase = 
      phase.name === 'FORECAST_COMMITMENT_START_TURN' || 
      phase.name === 'FORECAST_COMMITMENT_END_TURN';

    if (!isForecastCommitmentPhase) {
      throw new Error('Can only commit shares during forecast commitment phases');
    }

    // Count commitments made in this specific phase (limit: 2 per phase)
    const commitmentsInThisPhase = await this.prisma.forecastCommitment.findMany({
      where: {
        gameId,
        gameTurnId,
        playerId,
        phaseId,
      },
    });

    if (commitmentsInThisPhase.length >= 2) {
      throw new Error(
        `You can only make 2 commitments per phase. You have already made ${commitmentsInThisPhase.length} commitment(s) in this phase.`,
      );
    }

    // Validate shares belong to player and are from the specified sector
    const shares = await this.prisma.share.findMany({
      where: {
        id: { in: shareIds },
        playerId,
        location: 'PLAYER',
        isCommitted: false,
      },
      include: {
        Company: {
          include: {
            Sector: true,
          },
        },
      },
    });

    // Check all shares are from the same sector
    const allSameSector = shares.every(
      (share) => share.Company.sectorId === sectorId,
    );

    if (!allSameSector) {
      throw new Error('All shares must be from the same sector');
    }

    // Check if player already committed to this quarter this turn
    // (prevents committing to the same quarter twice in the same turn)
    const existingCommitment = await this.prisma.forecastCommitment.findFirst({
      where: {
        playerId,
        quarterId,
        gameTurnId,
      },
    });

    if (existingCommitment) {
      throw new Error(
        'You have already committed to this quarter this turn. You cannot commit to the same quarter again until the next turn.',
      );
    }

    // Get quarter to check share cost
    const quarter = await this.prisma.forecastQuarter.findUnique({
      where: { id: quarterId },
    });

    if (!quarter) {
      throw new Error('Quarter not found');
    }

    // Check share count doesn't exceed quarter cost
    if (shareIds.length > quarter.shareCost) {
      throw new Error(
        `Cannot commit more than ${quarter.shareCost} shares to this quarter`,
      );
    }

    // Create commitment
    const commitment = await this.prisma.forecastCommitment.create({
      data: {
        gameId,
        gameTurnId,
        phaseId,
        playerId,
        quarterId,
        sectorId,
        shareCount: shareIds.length,
        shares: {
          connect: shareIds.map((id) => ({ id })),
        },
      },
      include: {
        ForecastQuarter: true,
        Player: true,
        Sector: true,
        shares: true,
      },
    });

    // Mark shares as committed
    await this.prisma.share.updateMany({
      where: { id: { in: shareIds } },
      data: { isCommitted: true },
    });

    // Update quarter total
    await this.prisma.forecastQuarter.update({
      where: { id: quarterId },
      data: {
        totalSharesCommitted: {
          increment: shareIds.length,
        },
      },
    });

    await this.gameLogService.createGameLog({
      game: { connect: { id: gameId } },
      content: `${commitment.Player.nickname} committed ${shareIds.length} shares from ${commitment.Sector.name} to Quarter ${commitment.ForecastQuarter.quarterNumber}`,
    });

    return commitment;
  }

  /**
   * Apply sector abilities to forecast quarters
   * INDUSTRIALS: +1 to Q2, +1 to Q4
   * TECHNOLOGY: Random one of +3 to Q1, -3 to Q1, or -2 to Q1
   * ENERGY: +1 to Q1, +1 to Q3
   */
  async applySectorAbilities(gameId: string) {
    const sectors = await this.sectorService.sectors({
      where: { gameId },
    });

    const quarters = await this.getForecastQuarters(gameId);

    for (const sector of sectors) {
      if (sector.sectorName === SectorName.INDUSTRIALS) {
        // +1 to Q2, +1 to Q4
        const q2 = quarters.find((q) => q.quarterNumber === 2);
        const q4 = quarters.find((q) => q.quarterNumber === 4);
        if (q2) {
          await this.prisma.forecastQuarter.update({
            where: { id: q2.id },
            data: { demandCounters: { increment: 1 } },
          });
        }
        if (q4) {
          await this.prisma.forecastQuarter.update({
            where: { id: q4.id },
            data: { demandCounters: { increment: 1 } },
          });
        }
        await this.gameLogService.createGameLog({
          game: { connect: { id: gameId } },
          content: `INDUSTRIALS sector ability: +1 to Q2, +1 to Q4`,
        });
      } else if (sector.sectorName === SectorName.TECHNOLOGY) {
        // Random: +3 to Q1, -3 to Q1, or -2 to Q1
        const q1 = quarters.find((q) => q.quarterNumber === 1);
        if (q1) {
          const options = [3, -3, -2];
          const randomValue = options[Math.floor(Math.random() * options.length)];
          await this.prisma.forecastQuarter.update({
            where: { id: q1.id },
            data: { demandCounters: { increment: randomValue } },
          });
          await this.gameLogService.createGameLog({
            game: { connect: { id: gameId } },
            content: `TECHNOLOGY sector ability: ${randomValue > 0 ? '+' : ''}${randomValue} to Q1`,
          });
        }
      } else if (sector.sectorName === SectorName.ENERGY) {
        // +1 to Q1, +1 to Q3
        const q1 = quarters.find((q) => q.quarterNumber === 1);
        const q3 = quarters.find((q) => q.quarterNumber === 3);
        if (q1) {
          await this.prisma.forecastQuarter.update({
            where: { id: q1.id },
            data: { demandCounters: { increment: 1 } },
          });
        }
        if (q3) {
          await this.prisma.forecastQuarter.update({
            where: { id: q3.id },
            data: { demandCounters: { increment: 1 } },
          });
        }
        await this.gameLogService.createGameLog({
          game: { connect: { id: gameId } },
          content: `ENERGY sector ability: +1 to Q1, +1 to Q3`,
        });
      }
    }
  }

  /**
   * Add brand bonus as demand counters to Q1
   */
  async addBrandBonusToQ1(gameId: string) {
    const sectors = await this.prisma.sector.findMany({
      where: { gameId },
      include: {
        Company: {
          select: { brandScore: true },
        },
      },
    });

    const q1 = await this.prisma.forecastQuarter.findFirst({
      where: { gameId, quarterNumber: 1 },
    });

    if (!q1) {
      throw new Error('Q1 not found');
    }

    let totalBrandScore = 0;
    for (const sector of sectors) {
      const sectorBrandScore = sector.Company.reduce(
        (sum: number, company: { brandScore: number | null }) => sum + (company.brandScore || 0),
        0,
      );
      totalBrandScore += sectorBrandScore;
    }

    await this.prisma.forecastQuarter.update({
      where: { id: q1.id },
      data: { demandCounters: { increment: totalBrandScore } },
    });

    await this.gameLogService.createGameLog({
      game: { connect: { id: gameId } },
      content: `Added ${totalBrandScore} brand bonus to Q1`,
    });
  }

  /**
   * Calculate demand counters from share commitments
   * demandCounters = totalSharesCommitted / shareCost (for each quarter)
   */
  async calculateDemandCounters(gameId: string) {
    const quarters = await this.getForecastQuarters(gameId);

    for (const quarter of quarters) {
      const demandCounters = Math.floor(
        quarter.totalSharesCommitted / quarter.shareCost,
      );
      await this.prisma.forecastQuarter.update({
        where: { id: quarter.id },
        data: { demandCounters },
      });
    }

    await this.gameLogService.createGameLog({
      game: { connect: { id: gameId } },
      content: 'Calculated demand counters from share commitments',
    });
  }

  /**
   * Shift quarters left (Q1 becomes active, Q2->Q1, Q3->Q2, Q4->Q3, new Q4)
   */
  async shiftQuartersLeft(gameId: string) {
    const quarters = await this.prisma.forecastQuarter.findMany({
      where: { gameId },
      orderBy: { quarterNumber: 'asc' },
    });

    // Q1 becomes active (isActive = true)
    if (quarters[0]) {
      await this.prisma.forecastQuarter.update({
        where: { id: quarters[0].id },
        data: { isActive: true },
      });
    }

    // Shift data: Q2 -> Q1, Q3 -> Q2, Q4 -> Q3
    for (let i = 0; i < 3; i++) {
      if (quarters[i + 1]) {
        await this.prisma.forecastQuarter.update({
          where: { id: quarters[i].id },
          data: {
            totalSharesCommitted: quarters[i + 1].totalSharesCommitted,
            demandCounters: quarters[i + 1].demandCounters,
            sectorId: quarters[i + 1].sectorId,
            isActive: i === 0, // Q1 (now holding Q2's data) becomes active
          },
        });
      }
    }

    // Reset Q4 (new quarter)
    if (quarters[3]) {
      await this.prisma.forecastQuarter.update({
        where: { id: quarters[3].id },
        data: {
          totalSharesCommitted: 0,
          demandCounters: 0,
          sectorId: null,
          isActive: false,
        },
      });
    }

    // Clear old commitments (they've moved to history)
    await this.prisma.forecastCommitment.deleteMany({
      where: { gameId },
    });

    await this.gameLogService.createGameLog({
      game: { connect: { id: gameId } },
      content: 'Shifted quarters left: Q1→Active, Q2→Q1, Q3→Q2, Q4→Q3, new Q4 created',
    });

    // Uncommit all shares
    await this.prisma.share.updateMany({
      where: { gameId, isCommitted: true },
      data: { isCommitted: false },
    });

    await this.gameLogService.createGameLog({
      game: { connect: { id: gameId } },
      content: 'Forecast quarters shifted left (Q1->Active, Q2->Q1, Q3->Q2, Q4->Q3, new Q4)',
    });
  }

  /**
   * Get demand scores for sectors based on forecast quarters
   * Tally demand counters per sector from all quarters
   * 1st place sector: 50% of economy score
   * 2nd place sector: 30% of economy score
   * 3rd place sector: 20% of economy score (rounded down)
   * 
   * Note: After quarters shift, we tally each sector's demand counters across all quarters
   */
  async getForecastDemandScores(gameId: string, economyScore: number) {
    // Get all quarters with their commitments (after shift, so active quarter is former Q1)
    const quarters = await this.prisma.forecastQuarter.findMany({
      where: { gameId },
      include: {
        commitments: {
          include: {
            Sector: true,
          },
        },
      },
    });

    // Tally demand counters per sector from all quarters
    // Each commitment contributes demand counters = shareCount / quarter.shareCost
    const sectorDemandCounters: Record<string, number> = {};
    
    for (const quarter of quarters) {
      // Each commitment contributes to its sector's total
      for (const commitment of quarter.commitments) {
        const sectorId = commitment.sectorId;
        if (!sectorDemandCounters[sectorId]) {
          sectorDemandCounters[sectorId] = 0;
        }
        // Calculate this commitment's contribution to demand counters
        // demandCounters = shareCount / quarter.shareCost (rounded down)
        const contribution = Math.floor(commitment.shareCount / quarter.shareCost);
        sectorDemandCounters[sectorId] += contribution;
      }
    }

    // Sort sectors by total demand counters (descending)
    const sortedSectors = Object.entries(sectorDemandCounters)
      .sort(([, a], [, b]) => b - a)
      .map(([sectorId, counters]) => ({ sectorId, counters }));

    // Return sector scores (sectorId -> consumer count)
    const sectorScores: Record<string, number> = {};
    
    if (sortedSectors.length >= 1) {
      sectorScores[sortedSectors[0].sectorId] = Math.floor(economyScore * 0.5);
    }
    if (sortedSectors.length >= 2) {
      sectorScores[sortedSectors[1].sectorId] = Math.floor(economyScore * 0.3);
    }
    if (sortedSectors.length >= 3) {
      sectorScores[sortedSectors[2].sectorId] = Math.floor(economyScore * 0.2);
    }

    return sectorScores;
  }

  /**
   * Get sector rankings based on forecast demand counters
   * Returns array of { sectorId, rank, demandCounters, sectorName } sorted by rank (1st, 2nd, 3rd, etc.)
   * Handles ties - sectors with the same demand counters share the same rank
   * Used for worker salary calculations and display
   */
  async getForecastRankings(gameId: string) {
    // Get all quarters with their commitments
    const quarters = await this.prisma.forecastQuarter.findMany({
      where: { gameId },
      include: {
        commitments: {
          include: {
            Sector: true,
          },
        },
      },
    });

    // Tally demand counters per sector from all quarters
    const sectorDemandCounters: Record<string, { counters: number; sectorName: string }> = {};
    
    for (const quarter of quarters) {
      for (const commitment of quarter.commitments) {
        const sectorId = commitment.sectorId;
        if (!sectorDemandCounters[sectorId]) {
          sectorDemandCounters[sectorId] = {
            counters: 0,
            sectorName: commitment.Sector.name,
          };
        }
        // Calculate this commitment's contribution to demand counters
        const contribution = Math.floor(commitment.shareCount / quarter.shareCost);
        sectorDemandCounters[sectorId].counters += contribution;
      }
    }

    // Sort sectors by total demand counters (descending)
    const sortedSectors = Object.entries(sectorDemandCounters)
      .sort(([, a], [, b]) => b.counters - a.counters)
      .map(([sectorId, data]) => ({
        sectorId,
        demandCounters: data.counters,
        sectorName: data.sectorName,
      }));

    // Assign ranks, handling ties (sectors with same demand counters share rank)
    const rankings: Array<{ sectorId: string; rank: number; demandCounters: number; sectorName: string }> = [];
    let currentRank = 1;
    
    for (let i = 0; i < sortedSectors.length; i++) {
      const sector = sortedSectors[i];
      
      // If this sector has the same demand counters as the previous one, it shares the rank
      if (i > 0 && sortedSectors[i - 1].demandCounters === sector.demandCounters) {
        rankings.push({
          ...sector,
          rank: rankings[i - 1].rank, // Share the previous rank
        });
      } else {
        rankings.push({
          ...sector,
          rank: currentRank,
        });
        currentRank = i + 2; // Next rank (accounting for potential ties)
      }
    }

    return rankings;
  }

  /**
   * Get player's committed shares for a turn
   */
  async getPlayerCommitments(
    gameId: string,
    gameTurnId: string,
    playerId: string,
  ) {
    return this.prisma.forecastCommitment.findMany({
      where: {
        gameId,
        gameTurnId,
        playerId,
      },
      include: {
        ForecastQuarter: true,
        Sector: true,
        shares: {
          include: {
            Company: true,
          },
        },
      },
    });
  }
}
