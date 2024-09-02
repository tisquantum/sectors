import { Injectable, OnModuleDestroy } from '@nestjs/common';

interface Timer {
  id: string;
  gameId: string;
  timeout: NodeJS.Timeout;
  callback: () => void;
}

@Injectable()
export class TimerService implements OnModuleDestroy {
  private timers: Map<string, Timer> = new Map();
  private gameTimers: Map<string, string> = new Map(); // Maps gameId to timer id

  setTimer(
    id: string,
    gameId: string,
    delay: number,
    callback: () => void,
  ): void {
    // If a timer for this gameId already exists, clear it
    const existingTimerId = this.gameTimers.get(gameId);
    if (existingTimerId !== undefined) {
      this.clearTimer(existingTimerId);
    }

    const timeout = setTimeout(() => {
      callback();
      this.timers.delete(id);
      this.gameTimers.delete(gameId);
    }, delay);

    this.timers.set(id, { id, gameId, timeout, callback });
    this.gameTimers.set(gameId, id);
  }

  clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer.timeout);
      this.timers.delete(id);
      this.gameTimers.delete(timer.gameId);
    }
  }

  onModuleDestroy() {
    this.timers.forEach((timer) => clearTimeout(timer.timeout));
    this.timers.clear();
    this.gameTimers.clear();
  }
}
