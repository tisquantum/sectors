import { Injectable } from '@nestjs/common';
import { initTRPC } from '@trpc/server';
let superjson: typeof import('superjson');

eval(`import('superjson')`).then((module: typeof import('superjson')) => {
  superjson = module;
});

@Injectable()
export class TrpcService {
  trpc = initTRPC.create(
  //   {
  //   transformer: superjson,
  // }
);
  procedure = this.trpc.procedure;
  router = this.trpc.router;
  mergeRouters = this.trpc.mergeRouters;
}
