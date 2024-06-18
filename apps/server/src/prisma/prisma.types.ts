import {
  Company,
  MeetingMessage,
  Player,
  Room,
  RoomMessage,
  RoomUser,
  Sector,
  Stock,
  User,
} from '@prisma/client';

export type RoomMessageWithUser = RoomMessage & { user: User };

export type RoomUserWithUser = RoomUser & {
  user: User;
};

export type RoomWithUsers = Room & { users: { user: User }[] };

export type PlayerWithStocks = Player & {
  Stock: Stock[];
};

export type CompanyWithSector = Company & { Sector: Sector };

export type MeetingMessageWithPlayer = MeetingMessage & { player: Player };
