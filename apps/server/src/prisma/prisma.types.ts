import {
  CapitalGains,
  Card,
  Company,
  CompanyAction,
  Entity,
  Game,
  GameLog,
  GameRecord,
  GameTurn,
  InfluenceRound,
  InfluenceVote,
  InsolvencyContribution,
  MeetingMessage,
  OperatingRound,
  OperatingRoundVote,
  OptionContract,
  Phase,
  Player,
  PlayerOrder,
  PlayerPriority,
  PlayerResult,
  Prize,
  PrizeDistribution,
  PrizeVote,
  ProductionResult,
  ResearchDeck,
  RevenueDistributionVote,
  Room,
  RoomMessage,
  RoomUser,
  Sector,
  SectorPrize,
  Share,
  ShareContribution,
  ShortOrder,
  StockHistory,
  StockRound,
  Transaction,
  TransactionsOnShares,
  User,
} from '@prisma/client';

export type RoomMessageWithUser = RoomMessage & { user: User };

export type RoomUserWithUser = RoomUser & {
  user: User;
};

export type RoomWithUsers = Room & { users: { user: User }[] };

export type ShareWithCompany = Share & { Company: Company };

export type PlayerWithShares = Player & {
  Share: ShareWithCompany[];
};

export type ShareWithPlayer = Share & { Player: Player | null };
export type CompanyWithSector = Company & {
  Sector: Sector;
  Share: ShareWithPlayer[];
};
export type CompanyWithRelations = Company & {
  Sector: Sector;
  Share: ShareWithPlayer[];
  StockHistory: StockHistoryWithPhase[];
  Cards: Card[];
  CompanyActions: CompanyAction[];
};
export type StockHistoryWithPhase = StockHistory & { Phase: Phase };
export type CompanyWithSectorAndStockHistory = Company & {
  Sector: Sector;
  StockHistory: StockHistoryWithPhase[];
  Share: ShareWithPlayer[];
};

export type MeetingMessageWithPlayer = MeetingMessage & { player: Player };

export type GameState = Game & {
  Player: Player[];
  Company: Company[];
  sectors: Sector[];
  gameLogs: GameLog[];
  OperatingRound: OperatingRound[];
  StockRound: StockRound[];
  InfluenceRound: InfluenceRound[];
  Phase: Phase[];
  GameRecord: GameRecord | null;
};

export type RoomWithUsersAndGames = Room & {
  users: { user: User }[];
  game: Game[];
};

export type PlayerOrderHiddenFields =
  | 'term'
  | 'value'
  | 'quantity'
  | 'isSell'
  | 'orderType';

export type PlayerOrderConcealed = Omit<PlayerOrder, PlayerOrderHiddenFields>;
export type PlayerOrderConcealedWithPlayer = PlayerOrderConcealed & {
  Player: Player;
  Phase: PhaseWithStockRound;
};
export type PlayerOrderWithCompany = PlayerOrder & { Company: Company };
export type PlayerOrderWithCompanyAndOptionContract = PlayerOrder & {
  Company: Company;
  OptionContract: OptionContract | null;
};
export type CompanyWithShare = Company & { Share: Share[] };
export type CompanyWithShareAndCompanyActions = Company & {
  Share: Share[];
  CompanyActions: CompanyAction[];
};
export type CompanyWithShareAndSector = Company & {
  Share: Share[];
  Sector: Sector;
};
export type PhaseWithStockRound = Phase & { StockRound: StockRound | null };
export type PlayerOrderWithPlayerCompany = PlayerOrder & {
  Company: CompanyWithShareAndCompanyActions;
  Player: Player;
  Sector: Sector;
  Phase: Phase;
  GameTurn: GameTurn;
};
export type PlayerOrderWithPlayerRevealed = PlayerOrder & {
  Company: CompanyWithShareAndCompanyActions;
  Player: Player;
  Sector: Sector;
  Phase: PhaseWithStockRound;
  GameTurn: GameTurn;
};
export type SectorWithCompanyRelations = Sector & {
  Company: CompanyWithRelations[];
};
export type SectorWithCompanies = Sector & { Company: CompanyWithSector[] };
export type PlayerOrderWithPlayerCompanySectorShortOrder = PlayerOrder & {
  Company: Company;
  Player: Player;
  Sector: Sector;
  ShortOrder: ShortOrderWithShares | null;
};
export type ShortOrderWithShares = ShortOrder & { Share: Share[] };
export type PlayerOrderAllRelations = PlayerOrder & {
  Company: Company;
  Player: Player;
  Sector: Sector;
  GameTurn: GameTurn;
  ShortOrder: ShortOrder | null;
  OptionContract: OptionContract | null;
};

export type GameWithPhase = Game & { Phase: Phase[] };

export type RevenueDistributionVotesWithPlayer = RevenueDistributionVote & {
  Player: Player;
};

export type OperatingRoundWithRevenueDistributionVotes = OperatingRound & {
  revenueDistributionVotes: RevenueDistributionVotesWithPlayer[];
};

export type ProductionResultWithCompany = ProductionResult & {
  Company: CompanyWithRelations;
};

export type OperatingRoundWithProductionResults = OperatingRound & {
  productionResults: ProductionResultWithCompany[];
};

export type CompanyActionWithCompany = CompanyAction & { Company: Company };

export type OperatingRoundWithCompanyActions = OperatingRound & {
  companyActions: CompanyActionWithCompany[];
};

export type OperatingRoundVoteWithPlayer = OperatingRoundVote & {
  Player: Player & { Share: Share[] };
};

export type OperatingRoundWithOperatingRoundVotes = OperatingRound & {
  operatingRoundVote: OperatingRoundVoteWithPlayer[];
};

export type StockRoundWithPlayerOrders = StockRound & {
  playerOrders: PlayerOrderWithPlayerCompany[];
};

export type RevenueDistributionVoteWithRelations = RevenueDistributionVote & {
  Player: Player;
  Company: Company;
};
export type ShareWithRelations = Share & { Player: Player | null };
export type GameWithGameTurns = Game & { GameTurn: GameTurn[] };
export type CapitalGainsWithPlayer = CapitalGains & {
  Player: PlayerWithShares | null;
};

export type PlayerWithPlayerOrders = Player & {
  PlayerOrder: PlayerOrder[];
};

export type ResearchDeckWithCards = ResearchDeck & { cards: Card[] };

export type InfluenceVoteWithPlayer = InfluenceVote & { Player: Player };

export type InfluenceRoundWithVotes = InfluenceRound & {
  InfluenceVotes: InfluenceVoteWithPlayer[];
};

export type PlayerPriorityWithPlayer = PlayerPriority & { player: Player };

export type OptionContractWithRelations = OptionContract & {
  Company: Company;
  PlayerOrders: PlayerOrder[];
};

export type CompanyWithCards = Company & { Cards: Card[] };

export type PlayerOrderWithShortOrder = PlayerOrder & {
  ShortOrder: ShortOrder | null;
  Player: Player;
};

export type ShortOrderWithCompany = ShortOrder & { Company: Company };

export type ShortOrderWithRelations = ShortOrder & {
  Company: Company;
  PlayerOrder: PlayerOrder | null;
  Share: Share[];
};

export type GameTurnWithRelations = GameTurn & {
  companyActions: CompanyAction[];
};

export type TransactionWithEntities = Transaction & {
  fromEntity: Entity & { Player: Player | null; Company: Company | null };
  toEntity: Entity & { Player: Player | null; Company: Company | null };
  Shares: TransactionsOnShares[];
};

export type PlayerResultWithRelations = PlayerResult & {
  player: Player & { Share: Share[] };
};

export type CompanyWithSectorPartial = {
  id: string;
  name: string;
  unitPrice: number;
  prestigeTokens: number;
  demandScore: number;
  baseDemand: number;
  hasEconomiesOfScale: boolean;
  Sector: {
    name: string;
  };
};

export type CompanyOperationOrderPartial = {
  id: string;
  name: string;
  unitPrice: number;
  prestigeTokens: number;
  demandScore: number;
  baseDemand: number;
  hasEconomiesOfScale: boolean;
};

export type InsolvencyContributionWithRelations = InsolvencyContribution & {
  Player: Player;
  Company: Company;
  GameTurn: GameTurn;
};

export type ShareContributionWithShare = ShareContribution & { Share: Share };

export type SectorPrizeWithSector = SectorPrize & { Sector: Sector };

export type PrizeWithSectorPrizes = Prize & {
  SectorPrizes: SectorPrizeWithSector[];
};

export type PrizeDistributionWithRelations = PrizeDistribution & {
  Player: Player | null;
  Company: Company | null;
  GameTurn: GameTurn | null;
};

export type PrizeWithRelations = Prize & {
  SectorPrizes: SectorPrizeWithSector[];
  PrizeDistributions: PrizeDistributionWithRelations[];
};

export type PrizeVoteWithRelations = PrizeVote & {
  Player: Player;
  GameTurn: GameTurn;
  Prize: Prize;
};
