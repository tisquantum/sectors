export const EVENT_ROOM_JOINED = 'room-joined';
export const EVENT_ROOM_LEFT = 'room-left';
export const EVENT_ROOM_MESSAGE = 'room-message';
export const EVENT_ROOM_CREATED = 'room-created';

export const CHANNEL_ROOM_GLOBAL = 'room-global';
export const getRoomChannelId = (roomId: number) => `room-${roomId}`;
