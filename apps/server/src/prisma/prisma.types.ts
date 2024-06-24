import {
  Company,
  Game,
  GameLog,
  MeetingMessage,
  OperatingRound,
  Phase,
  Player,
  PlayerOrder,
  Room,
  RoomMessage,
  RoomUser,
  Sector,
  Share,
  StockRound,
  User,
} from '@prisma/client';

export type RoomMessageWithUser = RoomMessage & { user: User };

export type RoomUserWithUser = RoomUser & {
  user: User;
};

export type RoomWithUsers = Room & { users: { user: User }[] };

export type PlayerWithShares = Player & {
  Share: Share[];
};

export type CompanyWithSector = Company & { Sector: Sector; Share: Share[] };

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
export type PlayerOrderWithPlayerCompany = PlayerOrder & {
  Company: Company;
  Player: Player;
  Sector: Sector;
};
export type SectorWithCompanies = Sector & { Company: Company[] };