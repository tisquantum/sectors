import { Injectable } from '@nestjs/common';
import { initTRPC } from '@trpc/server';
import SuperJSON from 'superjson';

export const transformer = {
  input: {
    serialize: (object: unknown) => SuperJSON.stringify(object),
    deserialize: (object: string) => SuperJSON.parse(object),
  },
  output: {
    serialize: (object: unknown) => SuperJSON.stringify(object),
    deserialize: (object: string) => SuperJSON.parse(object),
  },
};

@Injectable()
export class TrpcService {
  trpc = initTRPC.create({
    transformer: transformer,
  });
  procedure = this.trpc.procedure;
  router = this.trpc.router;
  mergeRouters = this.trpc.mergeRouters;
}
