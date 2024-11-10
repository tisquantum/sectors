import {
  Agenda,
  CapitalGains,
  Card,
  Company,
  CompanyAction,
  CompanyActionOrder,
  CompanyAwardTrack,
  CompanyAwardTrackSpace,
  CompanySpace,
  Entity,
  ExecutiveAgenda,
  ExecutiveCard,
  ExecutiveGame,
  ExecutiveGameTurn,
  ExecutiveInfluenceBid,
  ExecutiveInfluenceVote,
  ExecutivePhase,
  ExecutivePlayer,
  ExecutivePlayerPass,
  ExecutiveTrick,
  ExecutiveVictoryPoint,
  Game,
  GameLog,
  GameRecord,
  GameTurn,
  Headline,
  Influence,
  InfluenceBid,
  InfluenceRound,
  InfluenceVote,
  InsolvencyContribution,
  MeetingMessage,
  OperatingRound,
  OperatingRoundVote,
  OptionContract,
  Phase,
  Player,
  PlayerHeadline,
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
  SectorPriority,
  SectorPrize,
  Share,
  ShareContribution,
  ShortOrder,
  StockHistory,
  StockRound,
  StockSubRound,
  Transaction,
  TransactionsOnShares,
  TrickCard,
  User,
} from '@prisma/client';

export type RoomMessageWithRoomUser = RoomMessage & {
  roomUser: RoomUserWithUserAndPlayer;
};

export type RoomUserWithUser = RoomUser & {
  user: User;
};
export type RoomUserWithUserAndPlayer = RoomUser & {
  user: User;
  player: Player | null;
};

export type RoomUserWithRelations = RoomUser & {
  user: User;
  player: Player | null;
  RoomMessage: RoomMessage[];
};

export type RoomWithUsers = Room & { users: { user: User }[] };

export type ShareWithCompany = Share & { Company: Company };

export type PlayerWithShares = Player & {
  Share: ShareWithCompany[];
};

export type ShareWithPlayer = Share & { Player: Player | null };
export type CompanyWithSectorOnly = Company & { Sector: Sector };
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
  sectorPriority: SectorPriority[];
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
export type CompanyWithCompanyActions = Company & {
  CompanyActions: CompanyAction[];
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
  companyActionOrder: CompanyActionOrder[];
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

export type UserRestricted = {
  id: string;
  name: string;
};

export type PlayerHeadlineWithPlayer = PlayerHeadline & {
  player: Player;
};

export type HeadlineWithRelations = Headline & {
  company: Company | null;
  sector: Sector | null;
  playerHeadlines: PlayerHeadlineWithPlayer[];
};

export type StockRoundWithStockSubRounds = StockRound & {
  stockSubRounds: StockSubRound[];
};

export type PhaseWithRelations = Phase & {
  GameTurn: GameTurn;
  StockRound: StockRound | null;
  OperatingRound: OperatingRound | null;
  StockSubRound: StockSubRound | null;
};

export type CompanySpaceWithCompany = CompanySpace & {
  Company: CompanyWithSectorOnly;
};

export type AwardTrackSpaceWithRelations = CompanyAwardTrackSpace & {
  companySpaces: CompanySpaceWithCompany[];
};

export type AwardTrackWithRelations = CompanyAwardTrack & {
  companyAwardTrackSpaces: AwardTrackSpaceWithRelations[];
};

export type ExecutivePlayerWithRelations = ExecutivePlayer & {
  user: User;
  victoryPoints: ExecutiveVictoryPoint[];
  cards: ExecutiveCard[];
  selfInfluence: Influence[];
  ownedByInfluence: Influence[];
  agendas: ExecutiveAgenda[];
  executiveTricks: ExecutiveTrick[];
};

export type ExecutiveGameWithRelations = ExecutiveGame & {
  players: ExecutivePlayer[];
  influence: Influence[];
  ExecutiveVictoryPoint: ExecutiveVictoryPoint[];
  ExecutiveAgenda: ExecutiveAgenda[];
  executiveCards: ExecutiveCard[];
  phases: ExecutivePhase[];
  gameTurn: ExecutiveGameTurn[];
};

export type InfluenceBidWithInfluence = InfluenceBid & { Influence: Influence };

export type ExecutiveInfluenceBidWithRelations = ExecutiveInfluenceBid & {
  toPlayer: ExecutivePlayer;
  fromPlayer: ExecutivePlayer;
  ExecutiveGameTurn: ExecutiveGameTurn | null;
  influenceBids: InfluenceBidWithInfluence[];
};

export type TrickCardWithRelations = TrickCard & {
  card: ExecutiveCard;
  player: ExecutivePlayer;
};

export type ExecutiveTrickWithRelations = ExecutiveTrick & {
  trickCards: TrickCardWithRelations[];
};

export type ExecutiveGameTurnWithRelations = ExecutiveGameTurn & {
  phases: ExecutivePhase[];
  tricks: ExecutiveTrickWithRelations[];
  influenceBids: ExecutiveInfluenceBid[];
  influenceVotes: ExecutiveInfluenceVote[];
  playerPasses: ExecutivePlayerPass[];
};
