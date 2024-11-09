export const EVENT_ROOM_JOINED = 'room-joined';
export const EVENT_ROOM_LEFT = 'room-left';
export const EVENT_ROOM_KICK = 'room-kick';
export const EVENT_ROOM_MESSAGE = 'room-message';
export const EVENT_ROOM_CREATED = 'room-created';
export const EVENT_PLAYER_JOINED = 'player-joined';
export const EVENT_PLAYER_LEFT = 'player-left';
export const EVENT_GAME_JOINED = 'game-joined';
export const EVENT_GAME_LEFT = 'game-left';
export const EVENT_GAME_STARTED = 'game-started';
export const EVENT_GAME_ENDED = 'game-ended';
export const EVENT_MEETING_MESSAGE_CREATED = 'meeting-message-created';
export const EVENT_NEW_PHASE = 'new-phase';
export const EVENT_NEW_PLAYER_ORDER = 'new-player-order';
export const EVENT_NEW_PLAYER_ORDER_PLAYER_ID = 'new-player-order-player-id';
export const EVENT_NEW_INVOLVENCY_CONTRIBUTION = 'new-insolvency-contribution';
export const EVENT_NEW_PRIZE_VOTE = 'new-prize-vote';
export const EVENT_PLAYER_READINESS_CHANGED = 'event-player-readiness-changed';
export const EVENT_NEW_PLAYER_HEADLINE = 'new-player-headline';
export const EVENT_EXECUTIVE_GAME_STARTED = 'executive-game-started';
export const EVENT_EXECUTIVE_NEW_PHASE = 'executive-new-phase';
export const EVENT_PING_PLAYERS = 'ping-players';
export interface EVENT_NEW_PLAYER_ORDER_PLAYER_ID__PAYLOAD {
  playerId: string;
}
export const CHANNEL_ROOM_GLOBAL = 'room-global';
export const getRoomChannelId = (roomId: number) => `room-${roomId}`;
export const getGameChannelId = (gameId: string) => `game-${gameId}`;
export const getExecutiveGameChannelId = (gameId: string) => `executive-game-${gameId}`;
