import {
  Company,
  CompanyAction,
  Game,
  GameLog,
  MeetingMessage,
  OperatingRound,
  OperatingRoundVote,
  OptionContract,
  Phase,
  Player,
  PlayerOrder,
  ProductionResult,
  RevenueDistributionVote,
  Room,
  RoomMessage,
  RoomUser,
  Sector,
  Share,
  ShortOrder,
  StockHistory,
  StockRound,
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
export type StockHistoryWithPhase = StockHistory & { Phase: Phase };
export type CompanyWithSectorAndStockHistory = Company & {
  Sector: Sector;
  StockHistory: StockHistoryWithPhase[];
};

export type MeetingMessageWithPlayer = MeetingMessage & { player: Player };

export type GameState = Game & {
  Player: Player[];
  Company: Company[];
  sectors: Sector[];
  gameLogs: GameLog[];
  OperatingRound: OperatingRound[];
  StockRound: StockRound[];
  Phase: Phase[];
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
};
export type PlayerOrderWithCompany = PlayerOrder & { Company: Company };
export type CompanyWithShare = Company & { Share: Share[] };
export type CompanyWithShareAndSector = Company & { Share: Share[], Sector: Sector };
export type PlayerOrderWithPlayerCompany = PlayerOrder & {
  Company: CompanyWithShare;
  Player: Player;
  Sector: Sector;
  Phase: Phase;
};
export type SectorWithCompanies = Sector & { Company: CompanyWithSector[] };
export type PlayerOrderWithPlayerCompanySectorShortOrder = PlayerOrder & {
  Company: Company;
  Player: Player;
  Sector: Sector;
  ShortOrder: ShortOrderWithShares | null;
};
export type ShortOrderWithShares = ShortOrder & { Share: Share[] };
export type PlayerOrdersAllRelations = PlayerOrder & {
  Company: Company;
  Player: Player;
  Sector: Sector;
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
  Company: Company & { Sector: Sector; Share: Share[] };
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
