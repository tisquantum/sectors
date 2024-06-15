import {
  Company,
  CompanyStock,
  GamePlayer,
  Player,
  PlayerStock,
  Room,
  RoomMessage,
  RoomUser,
  Stock,
  User,
} from '@prisma/client';

export type RoomMessageWithUser = RoomMessage & { user: User };

export type RoomUserWithUser = RoomUser & {
  user: User;
};

export type RoomWithUsers = Room & { users: { user: User }[] };

export type PlayerWithStock = Player & {
  companyStockAndStocks: { companyStock: CompanyStock; stock: Stock }[];
};

export type GamePlayerWithStock = GamePlayer & {
  Player: Player & {
    PlayerStock: (PlayerStock & {
      Stock: Stock;
    })[];
  };
};
