import { Injectable, OnModuleDestroy } from '@nestjs/common';

interface Timer {
  id: string;
  gameId: string;
  timeout: NodeJS.Timeout;
  callback: () => void;
  phaseStartTime: number; // To store the actual start time
}

@Injectable()
export class TimerService implements OnModuleDestroy {
  private timers: Map<string, Timer> = new Map();
  private gameTimers: Map<string, string> = new Map(); // Maps gameId to timer id

  setTimer(
    id: string,
    gameId: string,
    totalDuration: number, // Total phase time in ms
    phaseStartTime: number, // When the phase was supposed to start
    callback: () => void,
  ): void {
    // If a timer for this gameId already exists, clear it
    const existingTimerId = this.gameTimers.get(gameId);
    if (existingTimerId !== undefined) {
      this.clearTimer(existingTimerId);
    }

    const currentTime = Date.now();
    const elapsedTime = currentTime - phaseStartTime;
    const remainingTime = Math.max(totalDuration - elapsedTime, 0); // Ensure non-negative time

    if (remainingTime > 0) {
      const timeout = setTimeout(() => {
        callback();
        this.timers.delete(id);
        this.gameTimers.delete(gameId);
      }, remainingTime);

      this.timers.set(id, { id, gameId, timeout, callback, phaseStartTime });
      this.gameTimers.set(gameId, id);
    } else {
      // If time has already passed, execute the callback immediately
      callback();
    }
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
