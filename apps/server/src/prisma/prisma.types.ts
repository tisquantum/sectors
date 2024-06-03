import { Room, RoomMessage, RoomUser, User } from '@prisma/client';

export type RoomMessageWithUser = RoomMessage & {
  user: User;
};

export type RoomUserWithUser = RoomUser & {
  user: User;
};

export type RoomWithUser = Room & { users: { user: User }[] };
