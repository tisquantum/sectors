import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
//                     v-------------------- "query" goes here
export class PrismaService extends PrismaClient<Prisma.PrismaClientOptions, 'query'> 
  implements OnModuleInit 
{
  constructor() {
    super({
      log: [{ level: 'query', emit: 'event' }],
    });
  }

  async onModuleInit() {
    // Now TypeScript knows we're listening for "query" logs
    this.$on('query', (event) => {
      // console.log('Raw query:   ', event.query);
      // console.log('Parameters:  ', event.params);
      // console.log('Duration (ms):', event.duration);
    });

    await this.$connect();
  }
}
