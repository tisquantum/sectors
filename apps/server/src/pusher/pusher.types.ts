export const EVENT_ROOM_JOINED = 'room-joined';
export const EVENT_ROOM_LEFT = 'room-left';
export const EVENT_ROOM_MESSAGE = 'room-message';
export const EVENT_ROOM_CREATED = 'room-created';
export const EVENT_PLAYER_JOINED = 'player-joined';
export const EVENT_PLAYER_LEFT = 'player-left';
export const EVENT_GAME_JOINED = 'game-joined';
export const EVENT_GAME_LEFT = 'game-left';
export const EVENT_GAME_STARTED = 'game-started';
export const EVENT_MEETING_MESSAGE_CREATED = 'meeting-message-created';
export const EVENT_NEW_PHASE = 'new-phase';
export const EVENT_NEW_PLAYER_ORDER = 'new-player-order';
export const EVENT_NEW_PLAYER_ORDER_PLAYER_ID = 'new-player-order-player-id';
export interface EVENT_NEW_PLAYER_ORDER_PLAYER_ID__PAYLOAD {
    playerId: string;
}
export const CHANNEL_ROOM_GLOBAL = 'room-global';
export const getRoomChannelId = (roomId: number) => `room-${roomId}`;
export const getGameChannelId = (gameId: string) => `game-${gameId}`;
