// src/timer/timer.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';

interface Timer {
  id: string;
  timeout: NodeJS.Timeout;
  callback: () => void;
}

@Injectable()
export class TimerService implements OnModuleDestroy {
  private timers: Map<string, Timer> = new Map();

  setTimer(id: string, delay: number, callback: () => void): void {
    if (this.timers.has(id)) {
      throw new Error(`Timer with id ${id} already exists`);
    }
    
    const timeout = setTimeout(() => {
      callback();
      this.timers.delete(id);
    }, delay);

    this.timers.set(id, { id, timeout, callback });
  }

  clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer.timeout);
      this.timers.delete(id);
    }
  }

  onModuleDestroy() {
    this.timers.forEach(timer => clearTimeout(timer.timeout));
    this.timers.clear();
  }
}
